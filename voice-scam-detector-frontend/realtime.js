// Real-time voice monitoring with WebRTC
class RealTimeVoiceMonitor {
    constructor(app) {
        this.app = app;
        this.mediaRecorder = null;
        this.audioContext = null;
        this.stream = null;
        this.isRecording = false;
        this.audioChunks = [];
        this.recordingInterval = null;
        this.chunkDuration = 5000; // 5 second chunks
    }

    // Check if microphone access is supported
    static isSupported() {
        return navigator.mediaDevices && 
               navigator.mediaDevices.getUserMedia &&
               window.MediaRecorder;
    }

    // Request microphone permission and start monitoring
    async startRealTimeMonitoring() {
        try {
            console.log('🎤 Requesting microphone access...');
            
            if (!RealTimeVoiceMonitor.isSupported()) {
                throw new Error('Real-time monitoring not supported in this browser');
            }

            // Request microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000
                }
            });

            console.log('✅ Microphone access granted');
            this.app.showAlert('🎤 Microphone access granted - starting real-time monitoring', 'success');

            // Set up audio context for analysis
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Set up MediaRecorder for chunked recording
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            this.setupMediaRecorderEvents();
            this.startChunkedRecording();
            
            this.isRecording = true;
            return true;

        } catch (error) {
            console.error('❌ Microphone access failed:', error);
            
            let errorMessage = 'Microphone access denied or not available';
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Please allow microphone access and try again';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No microphone found on this device';
            }
            
            this.app.showAlert(`❌ ${errorMessage}`, 'error');
            return false;
        }
    }

    // Set up MediaRecorder event handlers
    setupMediaRecorderEvents() {
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            if (this.audioChunks.length > 0) {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.audioChunks = [];
                this.processAudioChunk(audioBlob);
            }
        };

        this.mediaRecorder.onerror = (event) => {
            console.error('❌ MediaRecorder error:', event.error);
            this.app.showAlert('❌ Recording error occurred', 'error');
        };
    }

    // Start recording in chunks for continuous analysis
    startChunkedRecording() {
        this.mediaRecorder.start();
        
        // Set up interval to create chunks
        this.recordingInterval = setInterval(() => {
            if (this.isRecording && this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.stop();
                setTimeout(() => {
                    if (this.isRecording) {
                        this.mediaRecorder.start();
                    }
                }, 100);
            }
        }, this.chunkDuration);
    }

    // Process each audio chunk through the backend
    async processAudioChunk(audioBlob) {
        try {
            console.log(`🔍 Processing audio chunk (${audioBlob.size} bytes)`);
            
            if (!this.app.backendAvailable) {
                console.log('⚠️ Backend not available, skipping analysis');
                return;
            }

            // Convert blob to file for upload
            const audioFile = new File([audioBlob], `chunk_${Date.now()}.webm`, {
                type: 'audio/webm'
            });

            // Upload to backend
            const uploadResult = await this.app.api.uploadFile(audioFile);
            if (uploadResult.error) {
                console.warn('⚠️ Upload failed:', uploadResult.detail);
                return;
            }

            // Analyze the chunk
            const analysisResult = await this.app.api.analyzeAudio(uploadResult.file_id);
            if (analysisResult.error) {
                console.warn('⚠️ Analysis failed:', analysisResult.error);
                return;
            }

            // Update UI with real-time results
            this.updateRealTimeDisplay(analysisResult);

        } catch (error) {
            console.error('❌ Chunk processing error:', error);
        }
    }

    // Update the UI with real-time analysis results
    updateRealTimeDisplay(analysisResult) {
        console.log('📊 Real-time analysis result:', analysisResult);

        // Format the results
        const formatted = this.app.api.formatAnalysisResult(analysisResult);
        
        // Update risk dialer
        const riskLevel = this.app.getRiskLevel(formatted.riskScore);
        this.app.updateRiskDialer(formatted.riskScore, riskLevel);

        // Add transcript messages if any
        if (analysisResult.transcript && analysisResult.transcript.length > 0) {
            let messages = this.app.api.createTranscriptMessages(analysisResult.transcript);
            messages = this.app.api.calculateMessageRisks(messages, analysisResult.flagged_segments || []);
            
            messages.forEach(message => {
                this.app.addTranscriptMessage(message);
            });
        }

        // Show alerts for high-risk content
        if (formatted.riskScore >= this.app.settings.scam_threshold) {
            this.app.showAlert(`🚨 SCAM DETECTED! Live Risk: ${formatted.riskScore}/100`, 'scam');
            this.app.expandTranscriptPanel();
            
            if (this.app.settings.voice_alerts) {
                this.app.speakAlert('Warning! Potential scam detected in real time.');
            }
            
        } else if (formatted.riskScore >= this.app.settings.suspicious_threshold) {
            this.app.showAlert(`⚠️ Suspicious activity detected. Risk: ${formatted.riskScore}/100`, 'warning');
        }

        // Update status
        this.app.updateAnalysisStatus('Real-time monitoring active');
    }

    // Stop real-time monitoring
    stopRealTimeMonitoring() {
        console.log('🛑 Stopping real-time monitoring...');
        
        this.isRecording = false;

        // Stop recording interval
        if (this.recordingInterval) {
            clearInterval(this.recordingInterval);
            this.recordingInterval = null;
        }

        // Stop MediaRecorder
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        // Stop audio stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.app.showAlert('🛑 Real-time monitoring stopped', 'success');
        console.log('✅ Real-time monitoring stopped');
    }

    // Check current recording status
    isActive() {
        return this.isRecording;
    }
}

// Export for use in main app
window.RealTimeVoiceMonitor = RealTimeVoiceMonitor;