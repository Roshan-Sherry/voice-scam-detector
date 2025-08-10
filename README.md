# Voice Scam Shield - Integrated Webapp

A defensive security tool for detecting voice-based scams using AI analysis and machine learning.

## 🏗️ Architecture

- **Backend**: FastAPI server with voice analysis, transcription, and scam detection
- **Frontend**: Mobile-first web application with real-time UI
- **AI Models**: AASIST for spoof detection, Whisper for speech-to-text

## 🚀 Quick Start

### 1. Start the Backend (Required)

```bash
./start-backend.sh
```

This will:
- Create a Python virtual environment
- Install all requirements
- Start the FastAPI server on http://localhost:8000
- Open API docs at http://localhost:8000/docs

### 2. Start the Frontend

```bash
./start-frontend.sh
```

This will:
- Start a web server on http://localhost:8080
- Serve the mobile-first web application

### 3. Use the Application

1. Open http://localhost:8080 in your browser
2. The app will check backend connectivity automatically
3. Upload audio files (.wav, .mp3, .m4a, .ogg) for analysis
4. Or use the demo mode for testing scenarios

## 📱 Features

### Backend Features
- **File Upload & Processing**: Supports multiple audio formats
- **Speech-to-Text**: Local Whisper model integration
- **Voice Spoofing Detection**: AASIST-L model for synthetic voice detection
- **Scam Pattern Detection**: Keyword and regex-based risk analysis
- **RESTful API**: FastAPI with automatic documentation

### Frontend Features
- **Mobile-First Design**: Optimized for touch devices
- **Real-Time Status**: Backend connectivity monitoring
- **File Upload Interface**: Drag-and-drop audio file analysis
- **Risk Visualization**: Dynamic risk dial with color-coded alerts
- **Multi-language Support**: English, Spanish, French
- **Demo Mode**: Pre-built scenarios for testing
- **Accessibility**: ARIA labels and keyboard navigation

## 🔧 Manual Setup

If the startup scripts don't work:

### Backend Setup
```bash
cd voice-scam-detector-backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup
```bash
cd voice-scam-detector-frontend
python3 -m http.server 8080
# Or use any web server of your choice
```

## 📊 API Endpoints

- `POST /upload` - Upload audio files for processing
- `POST /transcribe` - Generate transcript from uploaded file
- `POST /analyze` - Full analysis including risk scoring
- `GET /docs` - Interactive API documentation

## 🎯 Risk Levels

- **Safe (0-30)**: ✅ No threats detected
- **Suspicious (31-69)**: ⚠️ Potential concerns identified
- **Scam (70-100)**: 🚨 High-risk patterns detected

## 🛡️ Security Features

- CORS protection for cross-origin requests
- File type validation and size limits
- Input sanitization and error handling
- No sensitive data logging

## 🔍 Testing

1. Use the included test audio files in `voice-scam-detector-backend/uploads/`
2. Try the demo scenarios in the frontend
3. Upload your own audio files for analysis

## 📝 Requirements

- Python 3.8+ (for backend)
- Web browser with JavaScript enabled
- At least 2GB RAM (for AI models)
- Internet connection (for model downloads)

## 🚨 Disclaimer

This tool is for defensive security purposes only. It helps detect potential voice scams but should not be the sole basis for important decisions. Always verify suspicious calls through official channels.