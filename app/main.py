# app/main.py
import os
import uuid
import subprocess
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from pathlib import Path
from typing import List
from app.vad_utils import get_vad_segments

app = FastAPI()
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

def save_upload_and_convert(file: UploadFile, target_sr=16000) -> str:
    """Save uploaded file, convert to 16k mono WAV using ffmpeg, return path."""
    uid = uuid.uuid4().hex
    raw_path = UPLOAD_DIR / f"{uid}_raw"
    with open(raw_path, "wb") as f:
        f.write(file.file.read())
    out_wav = UPLOAD_DIR / f"{uid}.wav"
    # convert to mono 16k 16-bit PCM
    cmd = [
        "ffmpeg", "-y", "-i", str(raw_path),
        "-ac", "1", "-ar", str(target_sr), "-sample_fmt", "s16",
        str(out_wav)
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    # remove raw if you like
    try:
        raw_path.unlink()
    except Exception:
        pass
    return str(out_wav)

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    wav_path = save_upload_and_convert(file)
    file_id = Path(wav_path).stem  # uuid
    return {"file_id": file_id, "status": "saved", "path": wav_path}

class TranscribeRequest(BaseModel):
    file_id: str
    asr_mode: str = "local"   # 'local' or 'openai' (cloud)
    model: str = "tiny"       # for local whisper: tiny|small|...; optional

@app.post("/transcribe")
async def transcribe(req: TranscribeRequest):
    wav_path = UPLOAD_DIR / f"{req.file_id}.wav"
    if not wav_path.exists():
        return {"error": "file not found", "file_id": req.file_id}

    # 1) VAD segments
    try:
        vad_segments = get_vad_segments(str(wav_path))
    except Exception as e:
        vad_segments = []
    
    # 2) ASR (local whisper)
    transcript = []
    if req.asr_mode == "local":
        try:
            import whisper
            model = whisper.load_model(req.model)  # tiny/small/...
            result = model.transcribe(str(wav_path), language="en")
            # result['segments'] is list of {start, end, text}
            transcript = result.get("segments", [])
        except Exception as e:
            transcript = [{"start": 0.0, "end": 0.0, "text": f"ASR error: {e}"}]
    else:
        # Placeholder for cloud ASR integration (OpenAI or other providers)
        transcript = [{"start": 0.0, "end": 0.0, "text": "cloud ASR not configured"}]

    return {
        "file_id": req.file_id,
        "vad_segments": [{"start": s, "end": e} for (s, e) in vad_segments],
        "transcript": transcript
    }
