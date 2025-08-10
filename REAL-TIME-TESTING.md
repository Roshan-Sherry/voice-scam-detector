# Real-Time Voice Scam Detection Testing Guide

## 🎙️ Real-Time Mode Overview

The Voice Scam Shield now supports **real-time microphone monitoring** for live voice scam detection during actual phone calls.

## 📋 Testing Requirements

### System Requirements
- ✅ **Modern Browser**: Chrome, Firefox, Safari, Edge (with WebRTC support)
- ✅ **Microphone Access**: Built-in or external microphone
- ✅ **Backend Online**: FastAPI server running on port 8000
- ✅ **HTTPS** (for production) or **localhost** (for development)

### Current Status Check
1. Open http://localhost:8080
2. Look for **Backend Status** indicator (top right)
3. Check if **🎙️ Live** button appears (only when real-time is available)

## 🚀 How to Test Real-Time Mode

### Method 1: Direct Real-Time Button
1. **Open webapp**: http://localhost:8080
2. **Check status**: Ensure "Backend Online" appears
3. **Look for Live button**: 🎙️ Live button should be visible
4. **Click Live button**: Starts real-time microphone monitoring
5. **Grant permission**: Allow microphone access when prompted
6. **Start speaking**: Talk into microphone to test detection

### Method 2: Main Monitor Button (Auto-Detection)
1. **Click main 🎤 button**: Automatically chooses best mode
2. **If backend + microphone available**: Starts real-time mode
3. **If not available**: Falls back to demo mode
4. **Watch for alerts**: Shows which mode is active

## 🎯 Real-Time Testing Scenarios

### Test 1: Normal Conversation
1. Start real-time monitoring
2. Speak normally: "Hello, how are you today?"
3. **Expected**: Low/safe risk scores (0-30)

### Test 2: Suspicious Phrases
1. Start real-time monitoring  
2. Say suspicious keywords: "bank security", "verify account", "urgent"
3. **Expected**: Medium risk scores (31-69), yellow alerts

### Test 3: Scam Simulation
1. Start real-time monitoring
2. Say high-risk phrases: "IRS calling", "pay immediately with Bitcoin", "social security suspended"  
3. **Expected**: High risk scores (70-100), red alerts, voice warnings

### Test 4: Phone Call Simulation
1. Start real-time monitoring
2. Play scam audio through speakers (from test files)
3. Let microphone pick up the audio
4. **Expected**: Live analysis of the audio content

## 📊 Real-Time Features

### Live Analysis (Every 5 seconds)
- ✅ **Audio Chunking**: Records 5-second chunks
- ✅ **Speech-to-Text**: Transcribes speech in real-time
- ✅ **Risk Assessment**: Analyzes each chunk for scam patterns
- ✅ **Visual Feedback**: Updates risk dial immediately
- ✅ **Alert System**: Instant notifications for high-risk content

### Real-Time UI Elements
- 🎙️ **Microphone Icon**: Shows recording status
- 📊 **Risk Dial**: Updates live with each analysis
- 📝 **Live Transcript**: Shows real-time speech-to-text
- 🚨 **Instant Alerts**: Immediate scam warnings
- 🔊 **Voice Alerts**: Spoken warnings for high-risk content

## 🔧 Troubleshooting Real-Time Mode

### Issue: "Live" Button Not Visible
**Causes:**
- Backend offline
- Browser doesn't support WebRTC
- Microphone not available

**Solutions:**
1. Check backend status: http://localhost:8000/docs
2. Try different browser (Chrome recommended)
3. Check microphone permissions in browser settings
4. Ensure microphone is connected and working

### Issue: Microphone Permission Denied
**Solutions:**
1. Click browser's microphone icon in address bar
2. Select "Always allow" for localhost
3. Refresh page and try again
4. Check browser's privacy/security settings

### Issue: No Analysis Results
**Causes:**
- Microphone not picking up audio
- Audio chunks too quiet
- Backend processing errors

**Solutions:**
1. Speak louder or closer to microphone
2. Check browser console for errors (F12)
3. Test with file upload first to verify backend
4. Check backend logs for processing errors

### Issue: Delayed Analysis
**Expected Behavior:**
- 5-second chunks = 5-10 second delay is normal
- Processing time varies by system performance

**Optimization:**
- Reduce chunk duration (modify `chunkDuration` in realtime.js)
- Ensure stable internet connection
- Close other resource-intensive applications

## 🎛️ Testing Controls

### Browser Developer Tools
```javascript
// Test real-time monitor directly
const app = window.VoiceScamShield;
app.realTimeMonitor.startRealTimeMonitoring();

// Check status
console.log('Monitoring active:', app.realTimeMonitor.isActive());

// Stop monitoring
app.realTimeMonitor.stopRealTimeMonitoring();
```

### Manual API Testing
```bash
# Test backend with real audio file
curl -X POST "http://localhost:8000/upload" \
  -F "file=@test-audio.wav"

curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{"file_id":"YOUR_FILE_ID","asr_mode":"local","model":"tiny"}'
```

## 📱 Mobile Testing

### Mobile Browser Limitations
- **iOS Safari**: WebRTC support limited
- **Android Chrome**: Generally works well
- **Mobile Firefox**: Mixed compatibility

### Mobile-Specific Issues
- Microphone permission requests different on mobile
- Background processing may be limited
- Audio quality can vary

## 🚨 Security & Privacy

### Data Handling
- ✅ **Local Processing**: Audio processed locally when possible
- ✅ **Temporary Storage**: Audio chunks deleted after analysis
- ✅ **No Persistent Recording**: No long-term audio storage
- ✅ **Secure Transmission**: HTTPS for production deployments

### Privacy Controls
- User must grant explicit microphone permission
- Real-time monitoring can be stopped anytime
- No audio data sent without user consent
- Clear visual indicators when recording

## 🔍 Advanced Testing

### Performance Testing
1. Monitor CPU/memory usage during real-time mode
2. Test with background noise and multiple voices
3. Verify accuracy with different accents/languages
4. Test battery drain on mobile devices

### Stress Testing
1. Run real-time mode for extended periods
2. Test with rapid speech/multiple speakers
3. Simulate poor network conditions
4. Test with various audio qualities

---

## 🎯 Quick Test Checklist

- [ ] Backend running (http://localhost:8000/docs loads)
- [ ] Frontend accessible (http://localhost:8080 loads)
- [ ] "Backend Online" status visible
- [ ] 🎙️ "Live" button appears
- [ ] Microphone permission granted
- [ ] Real-time monitoring starts successfully
- [ ] Audio chunks processed every 5 seconds
- [ ] Risk dial updates with live analysis
- [ ] High-risk phrases trigger alerts
- [ ] Can stop monitoring cleanly

**For immediate testing, try speaking these phrases into the microphone:**
- Safe: "Hello, how is the weather today?"
- Suspicious: "This is from your bank security department"
- Scam: "You must pay $500 with Bitcoin immediately"