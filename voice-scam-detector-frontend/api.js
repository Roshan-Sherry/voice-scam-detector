// API Service for Voice Scam Shield Backend Integration
class VoiceScamAPI {
    constructor(baseURL = 'http://localhost:8000') {
        this.baseURL = baseURL;
        this.timeout = 30000; // 30 seconds
    }

    // Check if backend is available
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseURL}/docs`);
            return response.ok;
        } catch (error) {
            console.warn('Backend health check failed:', error);
            return false;
        }
    }

    // Upload audio file
    async uploadFile(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${this.baseURL}/upload`, {
                method: 'POST',
                body: formData,
                signal: AbortSignal.timeout(this.timeout)
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('File upload error:', error);
            throw new Error(`Upload failed: ${error.message}`);
        }
    }

    // Transcribe audio file
    async transcribeAudio(fileId, options = {}) {
        try {
            const requestBody = {
                file_id: fileId,
                asr_mode: options.asrMode || 'local',
                model: options.model || 'tiny'
            };

            const response = await fetch(`${this.baseURL}/transcribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody),
                signal: AbortSignal.timeout(this.timeout)
            });

            if (!response.ok) {
                throw new Error(`Transcription failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Transcription error:', error);
            throw new Error(`Transcription failed: ${error.message}`);
        }
    }

    // Analyze audio file (full analysis)
    async analyzeAudio(fileId, options = {}) {
        try {
            const requestBody = {
                file_id: fileId,
                asr_mode: options.asrMode || 'local',
                model: options.model || 'tiny'
            };

            const response = await fetch(`${this.baseURL}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody),
                signal: AbortSignal.timeout(this.timeout)
            });

            if (!response.ok) {
                throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Analysis error:', error);
            throw new Error(`Analysis failed: ${error.message}`);
        }
    }

    // Convert analysis result to frontend format
    formatAnalysisResult(analysisResult) {
        return {
            riskScore: Math.round((analysisResult.risk_score || 0) * 100),
            riskLevel: this.mapRiskLabel(analysisResult.risk_label),
            transcript: analysisResult.transcript || [],
            spoofDetection: analysisResult.spoof || {},
            flaggedSegments: analysisResult.flagged_segments || [],
            confidence: analysisResult.spoof?.bonafide_prob ? 
                Math.round((1 - analysisResult.spoof.bonafide_prob) * 100) : 0
        };
    }

    // Map backend risk labels to frontend levels
    mapRiskLabel(label) {
        if (!label) return 'safe';
        
        const labelLower = label.toLowerCase();
        if (labelLower.includes('scam') || labelLower.includes('high')) return 'scam';
        if (labelLower.includes('suspicious') || labelLower.includes('medium')) return 'suspicious';
        return 'safe';
    }

    // Create transcript messages from backend transcript
    createTranscriptMessages(transcript) {
        return transcript.map((segment, index) => ({
            id: index,
            speaker: segment.speaker || 'Caller',
            text: segment.text || '',
            timestamp: Date.now() + (segment.start || 0) * 1000,
            risk: 0, // Will be calculated based on flagged segments
            analysis: 'Processed by AI analysis'
        }));
    }

    // Calculate per-message risk from flagged segments
    calculateMessageRisks(messages, flaggedSegments) {
        return messages.map(message => {
            // Find matching flagged segments for this message
            const matchingFlags = flaggedSegments.filter(flag => 
                flag.text && message.text.includes(flag.text)
            );

            if (matchingFlags.length > 0) {
                const keywords = matchingFlags.flatMap(flag => flag.keywords || []);
                message.risk = this.calculateRiskFromKeywords(keywords);
                message.analysis = `Flagged keywords: ${keywords.join(', ')}`;
            }

            return message;
        });
    }

    // Calculate risk score from keywords
    calculateRiskFromKeywords(keywords) {
        const riskWeights = {
            'money': 30,
            'transfer': 40,
            'urgent': 35,
            'otp': 60,
            'password': 70,
            'code': 50,
            'verification': 55,
            'bank account': 65,
            'credit card': 60,
            'phone_number': 45,
            'currency_amount': 50,
            'verification_code': 85
        };

        let totalRisk = 0;
        keywords.forEach(keyword => {
            totalRisk += riskWeights[keyword] || 25;
        });

        return Math.min(100, totalRisk);
    }
}

// Export the API class
window.VoiceScamAPI = VoiceScamAPI;