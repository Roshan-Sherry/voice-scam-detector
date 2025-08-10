# Voice Scam Shield – Backend

Backend service for **Voice Scam Shield – Multilingual AI for Real-Time Call Scam Detection**.

This FastAPI backend provides:
- **Audio upload & preprocessing** (FFmpeg, mono, 16 kHz WAV)
- **VAD (Voice Activity Detection)** – detect active speech segments
- **ASR (Automatic Speech Recognition)** – Whisper (local tiny model by default)
- **Anti-Spoofing Detection** – AASIST-L model for synthetic voice detection
- **Scam Intent Detection** – keyword/regex heuristics (LLM checker planned)
- **Unified Risk Scoring** – combines spoof probability & scam intent

Frontend is handled by Team B. This README is for **Team A’s backend usage**.

---

## 📦 Requirements

### 1. Install dependencies
```bash
python -m venv venv
source venv/bin/activate   # (Linux/Mac)
venv\Scripts\activate      # (Windows)

pip install --upgrade pip
pip install torch torchaudio librosa soundfile openai-whisper fastapi uvicorn ffmpeg-python
```

### 2. Install FFmpeg
- **Windows**: Download from https://ffmpeg.org/download.html and add to PATH.
- **Mac**: `brew install ffmpeg`
- **Linux**: `sudo apt install ffmpeg`

---

## 📂 Project Structure

```
voice-scam-detector/
│
├── app/
│   ├── main.py              # FastAPI entrypoint
│   ├── vad_utils.py         # VAD helper
│   ├── aasist_utils.py      # AASIST model loading & inference
│   └── ...
│
├── aasist/                  # Cloned AASIST repo
├── models/
│   └── AASIST-L.pth         # Anti-spoof model weights
├── uploads/                 # Uploaded audio files
└── README.md
```

---

## 🔧 Setup

1. **Clone the repository**
```bash
git clone https://github.com/<your-org>/voice-scam-detector.git
cd voice-scam-detector
```

2. **Download AASIST-L weights**  
Place the `AASIST-L.pth` model in:
```
models/AASIST-L.pth
```
If you don’t have it yet, download from your shared link or the official source.

3. **Run the backend**
```bash
uvicorn app.main:app --reload --port 8000
```

You should see:
```
Loading AASIST-L model from models/AASIST-L.pth...
AASIST-L loaded on cpu
```

---

## 🚀 API Usage

### 1. **Upload Audio**
Uploads any supported audio format. Backend converts to mono, 16 kHz WAV.

```bash
curl -X POST "http://localhost:8000/upload"      -F "file=@test.wav"
```

**Response:**
```json
{
  "file_id": "8a19f9a227bf4481842e5697026cfc5e",
  "status": "saved",
  "path": "uploads/8a19f9a227bf4481842e5697026cfc5e.wav"
}
```

---

### 2. **Analyze Audio**
Runs:
- VAD
- Whisper ASR (English tiny model)
- Anti-spoof (AASIST-L)
- Scam keyword detection
- Risk scoring

```bash
curl -X POST "http://localhost:8000/analyze"      -H "Content-Type: application/json"      -d '{
           "file_id": "8a19f9a227bf4481842e5697026cfc5e",
           "asr_mode": "local",
           "model": "tiny"
         }'
```

**Response:**
```json
{
  "file_id": "8a19f9a227bf4481842e5697026cfc5e",
  "risk_score": 0.4,
  "risk_label": "Safe",
  "reasons": [
    "spoof_prob=0.001 (genuine)",
    "1 suspicious segment(s) with keywords/regex matches"
  ],
  "flagged_segments": [
    {
      "start": 8.0,
      "end": 13.0,
      "speaker": "caller",
      "text": "Please call 1-800-599-0423.",
      "keywords": ["phone_number"]
    }
  ],
  "vad_segments": [[2.4, 15.36]],
  "transcript": [
    {"start":0.0,"end":6.0,"speaker":"caller","text":"We have an important message..."}
  ],
  "spoof": {
    "bonafide_prob": 0.999,
    "spoof_prob": 0.001,
    "label": "genuine"
  }
}
```

---

## 🧪 Testing

We recommend testing with:
- **Safe calls** – clean human voice recordings.
- **Scam calls** – synthetic voices, scammy phrases like “urgent transfer”, “OTP”, etc.
- **Mixed** – human + inserted synthetic segments.

If you want sample **synthetic voice audio clips**, use:
- [Freesound.org – Text-to-speech clips](https://freesound.org)
- Short clips from ASVspoof dataset (trim to < 30s for quick tests)

---

## 🛠 Developer Notes

- Whisper models are cached after first load in `app.state.whisper_model`.
- AASIST model is loaded once on server start — do **not** reload per request.
- FFmpeg is used for format conversion to ensure consistency.
- Spoof detection returns **both** `bonafide_prob` and `spoof_prob`.
- Risk scoring = `0.6 * intent_score + 0.4 * spoof_prob`.

---

## 📅 Next Steps (Backend)

- Integrate GPT-4o-mini scam intent checker into `/analyze`.
- Add speaker diarization (pyannote).
- Implement WebSocket streaming inference.
- Support multilingual ASR (EN, ES, FR).

---

## 📜 License

MIT License. See `LICENSE` file for details.
