# app/main.py
import os
import uuid
import subprocess
from pathlib import Path
from typing import List

from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel

import torch
import numpy as np

from app.vad_utils import get_vad_segments
from app.aasist_utils import load_aasist_model, predict_aasist_score

# ============ CONFIG ============
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
MODEL_DIR = BASE_DIR / "models"
MODEL_NAME = "AASIST-L"
MODEL_PATH = MODEL_DIR / "AASIST-L.pth"
TARGET_SR = 16000
UPLOAD_DIR.mkdir(exist_ok=True)
MODEL_DIR.mkdir(exist_ok=True)
# ================================

app = FastAPI(title="Voice Scam Shield - Backend")

# Device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Globals for models
aasist_model = None

@app.on_event("startup")
def startup_load_models():
    global aasist_model
    # Load AASIST-L model (must exist at MODEL_PATH)
    if MODEL_PATH.exists():
        try:
            aasist_model = load_aasist_model(device=device)
            print(f"✅ Loaded {MODEL_NAME} at {MODEL_PATH} on {device}")
        except Exception as e:
            aasist_model = None
            print(f"⚠️ Failed to load {MODEL_NAME}: {e}")
    else:
        print(f"⚠️ Model file not found at {MODEL_PATH}. AASIST disabled until model present.")

def _safe_run_ffmpeg(in_path: Path, out_path: Path, target_sr: int = TARGET_SR):
    """
    Try to convert to mono 16k wav using ffmpeg. If ffmpeg not available,
    just raise an exception so caller can fallback.
    """
    cmd = [
        "ffmpeg", "-y", "-i", str(in_path),
        "-ac", "1", "-ar", str(target_sr), "-sample_fmt", "s16",
        str(out_path)
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

def save_upload_and_convert(file: UploadFile, target_sr: int = TARGET_SR) -> str:
    """
    Save uploaded file to disk and convert to 16k mono WAV with ffmpeg.
    If ffmpeg is missing or conversion fails, try to save raw bytes with .wav extension.
    Returns path string to the WAV file.
    """
    uid = uuid.uuid4().hex
    raw_path = UPLOAD_DIR / f"{uid}_raw"
    with open(raw_path, "wb") as f:
        f.write(file.file.read())

    out_wav = UPLOAD_DIR / f"{uid}.wav"
    try:
        _safe_run_ffmpeg(raw_path, out_wav, target_sr=target_sr)
    except FileNotFoundError:
        # ffmpeg not found in PATH
        # attempt a fallback: assume raw is already a WAV, move it to out_wav
        try:
            raw_path.rename(out_wav)
        except Exception:
            # as last resort, keep raw file and return it (may later fail)
            return str(raw_path)
    except subprocess.CalledProcessError:
        # ffmpeg failed to convert: fallback rename if possible
        try:
            raw_path.rename(out_wav)
        except Exception:
            return str(raw_path)
    finally:
        # if raw still exists, remove it (if out_wav created); otherwise ignore
        if raw_path.exists() and out_wav.exists():
            try:
                raw_path.unlink()
            except Exception:
                pass

    return str(out_wav)

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    """
    Accepts a multipart file and saves + converts to wav. Returns file_id.
    """
    try:
        wav_path = save_upload_and_convert(file)
    except Exception as e:
        return {"error": "upload_failed", "detail": str(e)}

    file_id = Path(wav_path).stem
    return {"file_id": file_id, "status": "saved", "path": wav_path}

# Keep the TranscribeRequest model for compatibility
class TranscribeRequest(BaseModel):
    file_id: str
    asr_mode: str = "local"
    model: str = "tiny"

@app.post("/transcribe")
async def transcribe(req: TranscribeRequest):
    """
    Run ASR (local whisper or cloud). Returns timestamped transcript + vad segments.
    Whisper model is loaded lazily into app.state.whisper_model to avoid repeated loads.
    """
    wav_path = UPLOAD_DIR / f"{req.file_id}.wav"
    if not wav_path.exists():
        return {"error": "file not found", "file_id": req.file_id}

    # VAD
    try:
        vad_segments = get_vad_segments(str(wav_path))
    except Exception:
        vad_segments = []

    # ASR
    transcript = []
    if req.asr_mode == "local":
        try:
            import whisper
            if not hasattr(app.state, "whisper_model"):
                app.state.whisper_model = whisper.load_model(req.model)
            result = app.state.whisper_model.transcribe(str(wav_path), language="en")
            for seg in result.get("segments", []):
                transcript.append({
                    "start": float(seg.get("start", 0.0)),
                    "end": float(seg.get("end", 0.0)),
                    "speaker": "caller",
                    "text": seg.get("text", "").strip()
                })
        except Exception as e:
            transcript = [{"start": 0.0, "end": 0.0, "speaker": "caller", "text": f"ASR error: {e}"}]
    else:
        transcript = [{"start": 0.0, "end": 0.0, "speaker": "caller", "text": "cloud ASR not configured"}]

    return {
        "file_id": req.file_id,
        "vad_segments": vad_segments,
        "transcript": transcript
    }

class AnalyzeRequest(BaseModel):
    file_id: str
    asr_mode: str = "local"
    model: str = "tiny"

@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    """
    Full analysis endpoint that returns:
      - transcript (ASR)
      - vad_segments
      - spoof probabilities (bonafide_prob, spoof_prob) from AASIST-L
      - flagged_segments based on keyword/regex heuristics
      - risk_score and risk_label
    """
    wav_path = UPLOAD_DIR / f"{req.file_id}.wav"
    if not wav_path.exists():
        return {"error": "file not found", "file_id": req.file_id}

    # 1) VAD
    try:
        vad_segments = get_vad_segments(str(wav_path))
    except Exception:
        vad_segments = []

    # 2) ASR
    transcript = []
    if req.asr_mode == "local":
        try:
            import whisper
            if not hasattr(app.state, "whisper_model"):
                app.state.whisper_model = whisper.load_model(req.model)
            result = app.state.whisper_model.transcribe(str(wav_path), language="en")
            for seg in result.get("segments", []):
                transcript.append({
                    "start": float(seg.get("start", 0.0)),
                    "end": float(seg.get("end", 0.0)),
                    "speaker": "caller",
                    "text": seg.get("text", "").strip()
                })
        except Exception as e:
            transcript = [{"start": 0.0, "end": 0.0, "speaker": "caller", "text": f"ASR error: {e}"}]
    else:
        transcript = [{"start": 0.0, "end": 0.0, "speaker": "caller", "text": "cloud ASR not configured"}]

    # 3) Spoof detection using aasist_utils.predict_aasist_score (robust)
    spoof_score = 0.0
    bonafide_score = 1.0
    spoof_label = "unknown"
    global aasist_model

    if aasist_model is None:
        # Model not loaded
        spoof_label = "model_unavailable"
    else:
        try:
            res = predict_aasist_score(aasist_model, str(wav_path), device=device, verbose=False)
            bonafide_score = float(res.get("bonafide_prob", 0.0))
            spoof_score = float(res.get("spoof_prob", 0.0))
            spoof_label = "synthetic" if spoof_score > 0.5 else "genuine"
        except Exception as e:
            spoof_label = f"error: {e}"
            spoof_score = 0.0
            bonafide_score = 1.0

    # 4) Simple scam detection heuristics (keywords + regex)
    # Categorized scam keywords — all lowercase for matching
    suspicious_keywords = [
        # Money & Payment
        "money", "transfer", "payment", "deposit", "withdraw", "remit",
        "wire", "transaction", "send funds", "fund transfer",
        "bank account", "credit card", "debit card", "routing number",
        "account number", "swift code", "iban", "loan", "mortgage",

        # Urgency & Pressure
        "urgent", "immediately", "as soon as possible", "act now", "limited time",
        "final notice", "your account will be closed", "your service will be suspended",

        # Credentials & Security
        "otp", "one time password", "password", "pin", "passcode", "code",
        "verification", "verification code", "security code",
        "confirm your identity", "login details", "account credentials",

        # Tech Support / Impersonation
        "technical support", "customer support", "it department",
        "microsoft support", "apple support", "google support",
        "remote access", "teamviewer", "anydesk",

        # Government / Authority Threats
        "irs", "income tax", "tax department", "customs", "police",
        "warrant", "arrest", "immigration", "visa", "passport office",

        # Lottery / Prize Scams
        "you have won", "congratulations you won", "prize", "lottery", "jackpot",
        "lucky draw", "reward", "gift card", "cash prize",

        # Investments / Crypto
        "bitcoin", "crypto", "cryptocurrency", "investment scheme",
        "double your money", "guaranteed returns", "forex",

        # Phishing Phrases
        "click the link", "click here", "visit this link", "follow the link",
        "enter your details", "fill out the form", "provide your information",

        # Other Social Engineering
        "update your account", "re-activate your account", "suspend your account",
        "your account is compromised", "security alert", "unusual activity detected"
    ]

    flagged_segments = []
    keyword_hit_score = 0.0

    import re
    phone_pattern = re.compile(r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b")
    currency_pattern = re.compile(r"(?:\$|₹|€|£)\s?\d+(?:[.,]\d{2})?")
    verification_pattern = re.compile(r"(verification|security)\s+code", re.I)
    url_pattern = re.compile(r"https?://[^\s]+", re.I)

    for seg in transcript:
        text = seg.get("text", "")
        text_lower = text.lower()
        hits = [kw for kw in suspicious_keywords if kw in text_lower]

        if phone_pattern.search(text):
            hits.append("phone_number")
        if currency_pattern.search(text):
            hits.append("currency_amount")
        if verification_pattern.search(text):
            hits.append("verification_code")
        if url_pattern.search(text):
            hits.append("suspicious_url")

        if hits:
            flagged_segments.append({**seg, "keywords": hits})
            keyword_hit_score = max(keyword_hit_score, 0.8)

    # 5) Risk scoring heuristic
    # combine keyword hits and spoof probability (weights can be tuned)
    risk_score = round((0.5 * keyword_hit_score) + (0.5 * spoof_score), 2)

    # force high risk if verification code is found
    if any("verification_code" in fs.get("keywords", []) for fs in flagged_segments):
        risk_score = max(risk_score, 0.85)

    if risk_score > 0.75:
        risk_label = "Scam"
    elif risk_score > 0.5:
        risk_label = "Suspicious"
    else:
        risk_label = "Safe"

    return {
        "file_id": req.file_id,
        "vad_segments": vad_segments,
        "transcript": transcript,
        "spoof": {
            "bonafide_prob": round(bonafide_score, 3),
            "spoof_prob": round(spoof_score, 3),
            "label": spoof_label
        },
        "flagged_segments": flagged_segments,
        "risk_score": risk_score,
        "risk_label": risk_label,
        "reasons": [
            f"spoof_prob={round(spoof_score, 3)} ({spoof_label})",
            f"{len(flagged_segments)} suspicious segment(s) with keywords/regex matches"
        ]
    }
