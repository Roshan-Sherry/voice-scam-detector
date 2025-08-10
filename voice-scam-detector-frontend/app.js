// Voice Scam Shield - Mobile-First Dialer Application
class VoiceScamMobileApp {
    constructor() {
        // Initialize API client
        this.api = new VoiceScamAPI();
        this.backendAvailable = false;
        
        // Initialize real-time monitor
        this.realTimeMonitor = null;
        if (typeof RealTimeVoiceMonitor !== 'undefined') {
            this.realTimeMonitor = new RealTimeVoiceMonitor(this);
        }
        
        // Application state
        this.isMonitoring = false;
        this.currentCall = null;
        this.callStartTime = null;
        this.callTimer = null;
        this.performanceTimer = null;
        
        // Risk tracking
        this.currentRisk = {
            score: 0,
            level: 'safe',
            confidence: 0,
            description: 'System ready for protection'
        };
        
        // Application settings
        this.settings = {
            language: 'en',
            vibration: true,
            sound_alerts: true,
            voice_alerts: true,
            suspicious_threshold: 31,
            scam_threshold: 70
        };
        
        // Touch interaction state
        this.touchState = {
            startY: 0,
            currentY: 0,
            isDragging: false,
            panelExpanded: false
        };
        
        // Performance metrics
        this.performance = {
            latency: 0,
            accuracy: 87.5,
            totalCalls: 0,
            scamsDetected: 0,
            falsePositives: 0
        };
        
        // Multilingual demo scenarios
        this.demoScenarios = [
            {
                id: 'legitimate_insurance',
                title: 'Legitimate Insurance Call',
                language: 'en',
                maxRisk: 18,
                duration: 12000,
                description: 'Normal business call from insurance provider',
                messages: [
                    { 
                        speaker: 'Caller', 
                        text: 'Hello, this is Jennifer from ABC Insurance calling about your policy renewal.', 
                        risk: 8, 
                        timestamp: 0,
                        analysis: 'Normal business greeting with company identification'
                    },
                    { 
                        speaker: 'Caller', 
                        text: 'Your current policy expires next month and I wanted to discuss your coverage options.', 
                        risk: 12, 
                        timestamp: 3000,
                        analysis: 'Legitimate business purpose clearly stated'
                    },
                    { 
                        speaker: 'User', 
                        text: 'Yes, I was expecting your call. What do I need to know?', 
                        risk: 5, 
                        timestamp: 6000,
                        analysis: 'User response indicates familiarity'
                    },
                    { 
                        speaker: 'Caller', 
                        text: 'I can email you the renewal documents to review at your convenience.', 
                        risk: 10, 
                        timestamp: 9000,
                        analysis: 'Professional approach, no pressure tactics'
                    }
                ]
            },
            {
                id: 'suspicious_bank',
                title: 'Suspicious Bank Call',
                language: 'en',
                maxRisk: 52,
                duration: 10000,
                description: 'Caller claiming to be from bank security',
                messages: [
                    { 
                        speaker: 'Caller', 
                        text: 'This is the security department from your bank calling about unusual activity.', 
                        risk: 28, 
                        timestamp: 0,
                        analysis: 'Generic security claim without specific bank name'
                    },
                    { 
                        speaker: 'Caller', 
                        text: 'We need to verify your account information to protect your funds.', 
                        risk: 45, 
                        timestamp: 3500,
                        analysis: 'Request for sensitive information under security pretext'
                    },
                    { 
                        speaker: 'User', 
                        text: 'Which bank are you calling from? What account number?', 
                        risk: 8, 
                        timestamp: 7000,
                        analysis: 'User appropriately requesting verification'
                    },
                    { 
                        speaker: 'Caller', 
                        text: 'I cannot provide that for security reasons. Please confirm your details now.', 
                        risk: 52, 
                        timestamp: 8500,
                        analysis: 'Evasive response combined with urgency - suspicious pattern'
                    }
                ]
            },
            {
                id: 'irs_scam',
                title: 'IRS Impersonation Scam',
                language: 'en',
                maxRisk: 96,
                duration: 11000,
                description: 'High-risk scam impersonating government agency',
                messages: [
                    { 
                        speaker: 'Caller', 
                        text: 'This is Officer Johnson from the Internal Revenue Service.', 
                        risk: 65, 
                        timestamp: 0,
                        analysis: 'Government impersonation with fake authority title'
                    },
                    { 
                        speaker: 'Caller', 
                        text: 'Your social security number has been suspended due to fraudulent activity.', 
                        risk: 78, 
                        timestamp: 3000,
                        analysis: 'False claim about SSN suspension - common scam tactic'
                    },
                    { 
                        speaker: 'Caller', 
                        text: 'You must pay $2,500 immediately with Bitcoin or face arrest within 24 hours.', 
                        risk: 96, 
                        timestamp: 6500,
                        analysis: 'Critical red flags: payment demand, cryptocurrency, arrest threat'
                    },
                    { 
                        speaker: 'User', 
                        text: 'This sounds like a scam. I\'m ending this call.', 
                        risk: 5, 
                        timestamp: 9500,
                        analysis: 'User correctly identifying scam and taking protective action'
                    }
                ]
            },
            {
                id: 'spanish_bank_scam',
                title: 'Estafa Bancaria',
                language: 'es',
                maxRisk: 89,
                duration: 9500,
                description: 'Spanish language banking scam',
                messages: [
                    { 
                        speaker: 'Caller', 
                        text: 'Buenos días, soy del departamento de seguridad de su banco.', 
                        risk: 42, 
                        timestamp: 0,
                        analysis: 'Generic bank security claim without bank identification'
                    },
                    { 
                        speaker: 'Caller', 
                        text: 'Su cuenta ha sido comprometida y necesitamos verificar su información ahora mismo.', 
                        risk: 68, 
                        timestamp: 3000,
                        analysis: 'Account compromise claim with urgent verification request'
                    },
                    { 
                        speaker: 'Caller', 
                        text: 'Por favor proporcione su número de cuenta y código de seguridad inmediatamente.', 
                        risk: 89, 
                        timestamp: 6500,
                        analysis: 'Direct request for sensitive banking information'
                    }
                ]
            },
            {
                id: 'french_tax_scam',
                title: 'Arnaque Fiscale',
                language: 'fr',
                maxRisk: 94,
                duration: 8500,
                description: 'French language tax office scam',
                messages: [
                    { 
                        speaker: 'Caller', 
                        text: 'Bonjour, ici l\'administration fiscale française concernant vos impôts.', 
                        risk: 45, 
                        timestamp: 0,
                        analysis: 'Tax authority impersonation - common in France'
                    },
                    { 
                        speaker: 'Caller', 
                        text: 'Vous devez régler immédiatement 1800 euros d\'arriérés d\'impôts.', 
                        risk: 76, 
                        timestamp: 3000,
                        analysis: 'Immediate payment demand for tax arrears'
                    },
                    { 
                        speaker: 'Caller', 
                        text: 'Payez avec des cartes cadeaux Bitcoin sinon nous lancerons une procédure judiciaire.', 
                        risk: 94, 
                        timestamp: 6000,
                        analysis: 'Cryptocurrency payment demand with legal threats - clear scam'
                    }
                ]
            },
            {
                id: 'legitimate_customer_service',
                title: 'Service Client Légitime',
                language: 'fr',
                maxRisk: 15,
                duration: 7000,
                description: 'Legitimate French customer service call',
                messages: [
                    { 
                        speaker: 'Caller', 
                        text: 'Bonjour, je suis Marie du service client de votre opérateur téléphonique Orange.', 
                        risk: 10, 
                        timestamp: 0,
                        analysis: 'Specific company identification and personal name'
                    },
                    { 
                        speaker: 'Caller', 
                        text: 'Je vous appelle pour vous informer d\'une nouvelle offre disponible sur votre compte.', 
                        risk: 15, 
                        timestamp: 3500,
                        analysis: 'Informational purpose, no pressure or urgency'
                    },
                    { 
                        speaker: 'User', 
                        text: 'Merci, pouvez-vous m\'envoyer les détails par courrier?', 
                        risk: 5, 
                        timestamp: 6000,
                        analysis: 'User requesting written information - good practice'
                    }
                ]
            }
        ];
        
        // Scam detection patterns by language
        this.scamPatterns = {
            english: {
                authority: ['IRS', 'FBI', 'police', 'social security', 'medicare', 'federal', 'government'],
                urgency: ['immediately', 'urgent', 'expires today', 'act now', 'limited time', 'deadline'],
                payment: ['bitcoin', 'cryptocurrency', 'wire transfer', 'gift cards', 'western union', 'money order'],
                credentials: ['social security number', 'account details', 'pin', 'password', 'verification code'],
                threats: ['arrest', 'lawsuit', 'legal action', 'suspended', 'frozen', 'warrant']
            },
            spanish: {
                authority: ['hacienda', 'policía', 'seguridad social', 'gobierno', 'banco', 'seguridad'],
                urgency: ['inmediatamente', 'urgente', 'ahora mismo', 'tiempo limitado', 'expira hoy'],
                payment: ['bitcoin', 'transferencia', 'tarjetas regalo', 'western union', 'dinero'],
                credentials: ['número cuenta', 'código seguridad', 'contraseña', 'PIN', 'datos personales'],
                threats: ['arresto', 'demanda', 'acción legal', 'suspendido', 'congelado', 'orden']
            },
            french: {
                authority: ['impôts', 'police', 'sécurité sociale', 'gouvernement', 'banque', 'administration'],
                urgency: ['immédiatement', 'urgent', 'maintenant', 'temps limité', 'expire aujourd\'hui'],
                payment: ['bitcoin', 'virement', 'cartes cadeaux', 'western union', 'argent'],
                credentials: ['numéro compte', 'code sécurité', 'mot de passe', 'PIN', 'informations'],
                threats: ['arrestation', 'procès', 'action judiciaire', 'suspendu', 'gelé', 'mandat']
            }
        };
        
        // Supported languages
        this.languages = [
            { code: 'en', name: 'English', flag: '🇺🇸' },
            { code: 'es', name: 'Español', flag: '🇪🇸' },
            { code: 'fr', name: 'Français', flag: '🇫🇷' }
        ];
        
        this.init();
    }
    
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApplication());
        } else {
            this.setupApplication();
        }
    }
    
    async setupApplication() {
        console.log('🛡️ Voice Scam Shield Mobile - Initializing...');
        
        this.setupEventListeners();
        this.initializeUI();
        this.setupTouchGestures();
        this.setupPerformanceMonitoring();
        
        // Check backend availability
        await this.checkBackendStatus();
        
        // Show welcome message
        setTimeout(() => {
            const mode = this.backendAvailable ? 'with AI backend' : 'in demo mode';
            this.showAlert(`🛡️ Voice Scam Shield ready ${mode}`, 'success');
        }, 1000);
        
        console.log('✅ Voice Scam Shield Mobile - Ready');
    }
    
    setupEventListeners() {
        // Primary monitor button
        const monitorBtn = document.getElementById('monitor-btn');
        if (monitorBtn) {
            monitorBtn.addEventListener('click', () => this.toggleMonitoring());
            monitorBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.toggleMonitoring();
            });
        }
        
        // Demo scenarios
        const demoBtn = document.getElementById('demo-btn');
        if (demoBtn) {
            demoBtn.addEventListener('click', () => this.showDemoModal());
        }
        
        // Settings
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettingsModal());
        }
        
        // File upload
        const uploadBtn = document.getElementById('upload-btn');
        const fileInput = document.getElementById('file-input');
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files[0]));
        }
        
        // Real-time monitoring button
        const realtimeBtn = document.getElementById('realtime-btn');
        if (realtimeBtn) {
            realtimeBtn.addEventListener('click', () => this.toggleRealTimeMonitoring());
        }
        
        // Risk dialer interaction
        const riskDialer = document.getElementById('risk-dialer');
        if (riskDialer) {
            riskDialer.addEventListener('click', () => this.handleDialerInteraction());
        }
        
        // Modal controls
        this.setupModalEventListeners();
        
        // Settings controls
        this.setupSettingsEventListeners();
        
        // Alert dismissal
        const alertDismiss = document.getElementById('alert-dismiss');
        if (alertDismiss) {
            alertDismiss.addEventListener('click', () => this.hideAlert());
        }
        
        // Prevent zoom on double-tap
        this.preventDoubleTabZoom();
        
        // Handle app lifecycle
        this.setupAppLifecycleHandlers();
    }
    
    setupModalEventListeners() {
        // Demo modal
        const demoClose = document.getElementById('demo-close');
        const demoBackdrop = document.getElementById('demo-backdrop');
        
        if (demoClose) demoClose.addEventListener('click', () => this.hideDemoModal());
        if (demoBackdrop) demoBackdrop.addEventListener('click', () => this.hideDemoModal());
        
        // Settings modal
        const settingsClose = document.getElementById('settings-close');
        const settingsBackdrop = document.getElementById('settings-backdrop');
        
        if (settingsClose) settingsClose.addEventListener('click', () => this.hideSettingsModal());
        if (settingsBackdrop) settingsBackdrop.addEventListener('click', () => this.hideSettingsModal());
        
        // Escape key handling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideDemoModal();
                this.hideSettingsModal();
            }
        });
    }
    
    setupSettingsEventListeners() {
        // Language selection
        document.querySelectorAll('.language-option').forEach(option => {
            option.addEventListener('click', () => {
                const language = option.dataset.lang;
                this.setLanguage(language);
            });
        });
        
        // Toggle switches
        document.querySelectorAll('.toggle-switch').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const setting = toggle.id.replace('-toggle', '').replace('-', '_');
                this.toggleSetting(setting, toggle);
            });
        });
        
        // Threshold ranges
        const suspiciousRange = document.getElementById('suspicious-range');
        const scamRange = document.getElementById('scam-range');
        
        if (suspiciousRange) {
            suspiciousRange.addEventListener('input', (e) => {
                this.updateThreshold('suspicious', parseInt(e.target.value));
            });
        }
        
        if (scamRange) {
            scamRange.addEventListener('input', (e) => {
                this.updateThreshold('scam', parseInt(e.target.value));
            });
        }
    }
    
    setupTouchGestures() {
        const panelHandle = document.getElementById('panel-handle');
        const transcriptPanel = document.getElementById('transcript-panel');
        
        if (!panelHandle || !transcriptPanel) return;
        
        // Handle tap to toggle
        panelHandle.addEventListener('click', () => this.toggleTranscriptPanel());
        
        // Touch gesture handling
        let touchStartY = 0;
        let touchCurrentY = 0;
        let isDragging = false;
        let startTime = 0;
        
        const handleTouchStart = (e) => {
            touchStartY = e.touches[0].clientY;
            touchCurrentY = touchStartY;
            startTime = Date.now();
            isDragging = true;
            transcriptPanel.style.transition = 'none';
        };
        
        const handleTouchMove = (e) => {
            if (!isDragging) return;
            
            touchCurrentY = e.touches[0].clientY;
            const deltaY = touchCurrentY - touchStartY;
            const velocity = Math.abs(deltaY) / (Date.now() - startTime);
            
            if (this.touchState.panelExpanded) {
                // Panel expanded - allow swipe down
                if (deltaY > 0) {
                    e.preventDefault();
                    const newTransform = Math.min(deltaY, window.innerHeight * 0.6);
                    transcriptPanel.style.transform = `translateY(${newTransform}px)`;
                }
            } else {
                // Panel minimized - allow swipe up
                if (deltaY < 0) {
                    e.preventDefault();
                    const newTransform = Math.max(deltaY, -window.innerHeight * 0.6);
                    transcriptPanel.style.transform = `translateY(calc(100% - 140px + ${newTransform}px))`;
                }
            }
        };
        
        const handleTouchEnd = (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            transcriptPanel.style.transition = 'transform 0.4s var(--ease-standard)';
            
            const deltaY = touchCurrentY - touchStartY;
            const velocity = Math.abs(deltaY) / Math.max(Date.now() - startTime, 1);
            const threshold = velocity > 0.5 ? 30 : 60;
            
            if (Math.abs(deltaY) > threshold) {
                if (deltaY > 0 && this.touchState.panelExpanded) {
                    this.collapseTranscriptPanel();
                } else if (deltaY < 0 && !this.touchState.panelExpanded) {
                    this.expandTranscriptPanel();
                }
            } else {
                this.resetTranscriptPanel();
            }
        };
        
        panelHandle.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
    }
    
    setupPerformanceMonitoring() {
        this.performanceTimer = setInterval(() => {
            this.updatePerformanceMetrics();
        }, 5000);
    }
    
    setupAppLifecycleHandlers() {
        // Visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('📱 App backgrounded - monitoring continues');
            } else {
                console.log('📱 App foregrounded');
                this.updatePerformanceMetrics();
            }
        });
        
        // Orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 200);
        });
        
        // Before unload
        window.addEventListener('beforeunload', () => {
            if (this.performanceTimer) {
                clearInterval(this.performanceTimer);
            }
        });
    }
    
    preventDoubleTabZoom() {
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
    
    initializeUI() {
        this.updateRiskDialer(0, 'safe');
        this.updateProtectionStatus('protected');
        this.populateDemoScenarios();
        this.updateSettingsUI();
        this.updateLanguageDisplay();
        this.resetTranscriptPanel();
    }
    
    // === MONITORING CONTROLS ===
    
    toggleMonitoring() {
        this.isMonitoring = !this.isMonitoring;
        
        const monitorBtn = document.getElementById('monitor-btn');
        const monitorIcon = document.getElementById('monitor-icon');
        const monitorText = document.getElementById('monitor-text');
        
        if (this.isMonitoring) {
            // Start monitoring
            monitorBtn?.classList.add('monitoring');
            if (monitorIcon) monitorIcon.textContent = '⏹️';
            if (monitorText) monitorText.textContent = 'Stop Monitoring';
            
            this.updateProtectionStatus('monitoring');
            this.startAudioVisualization();
            this.showAlert('🎤 Live call monitoring activated', 'success');
            
            // Trigger haptic feedback
            this.triggerHapticFeedback('medium');
            
            // Start demo call simulation
            setTimeout(() => {
                if (this.isMonitoring) {
                    this.startRandomDemoCall();
                }
            }, 3000);
            
        } else {
            // Stop monitoring
            monitorBtn?.classList.remove('monitoring');
            if (monitorIcon) monitorIcon.textContent = '🎤';
            if (monitorText) monitorText.textContent = 'Start Monitoring';
            
            this.updateProtectionStatus('protected');
            this.stopAudioVisualization();
            this.endCurrentCall();
            this.showAlert('⏹️ Call monitoring stopped', 'success');
            
            // Reset UI after delay
            setTimeout(() => {
                this.updateRiskDialer(0, 'safe');
                this.clearTranscript();
                this.updateAnalysisStatus('Waiting');
            }, 1500);
        }
        
        this.performance.totalCalls += this.isMonitoring ? 0 : 1;
    }
    
    // === RISK DIALER MANAGEMENT ===
    
    updateRiskDialer(score, level) {
        const dialerContainer = document.getElementById('risk-dialer-container');
        const dialer = document.getElementById('risk-dialer');
        const riskScore = document.getElementById('risk-score');
        const riskLabel = document.getElementById('risk-label');
        
        if (!dialer || !riskScore || !riskLabel) return;
        
        // Update score display with animation
        this.animateNumberChange(riskScore, this.currentRisk.score, score, 500);
        riskLabel.textContent = this.formatRiskLevel(level);
        
        // Update dialer appearance
        dialer.className = `risk-dialer ${level}`;
        
        // Update risk indicator dots
        this.updateRiskIndicatorDots(level);
        
        // Store current risk state
        this.currentRisk = {
            score,
            level,
            confidence: Math.min(95, score + Math.random() * 10),
            description: this.generateRiskDescription(score, level)
        };
        
        // Trigger appropriate feedback
        if (level === 'scam') {
            this.triggerHapticFeedback('heavy');
            if (this.settings.sound_alerts) {
                this.playAlertSound('scam');
            }
        } else if (level === 'suspicious') {
            this.triggerHapticFeedback('medium');
        }
        
        console.log(`🎯 Risk Updated: ${score} (${level})`);
    }
    
    updateRiskIndicatorDots(level) {
        document.querySelectorAll('.risk-dot').forEach(dot => {
            dot.style.background = 'rgba(255, 255, 255, 0.2)';
            dot.style.boxShadow = 'none';
        });
        
        const activeDot = document.querySelector(`[data-level="${level}"]`);
        if (activeDot) {
            const colors = {
                'safe': '#10b981',
                'suspicious': '#f59e0b',
                'scam': '#ef4444'
            };
            activeDot.style.background = colors[level];
            activeDot.style.boxShadow = `0 0 16px ${colors[level]}60`;
        }
    }
    
    formatRiskLevel(level) {
        const labels = {
            'safe': 'Safe',
            'suspicious': 'Suspicious',
            'scam': 'SCAM ALERT'
        };
        return labels[level] || 'Safe';
    }
    
    generateRiskDescription(score, level) {
        if (level === 'scam') return 'HIGH RISK: Likely scam - take immediate action';
        if (level === 'suspicious') return 'CAUTION: Suspicious patterns detected';
        return 'PROTECTED: No threats detected';
    }
    
    getRiskLevel(score) {
        if (score >= this.settings.scam_threshold) return 'scam';
        if (score >= this.settings.suspicious_threshold) return 'suspicious';
        return 'safe';
    }
    
    handleDialerInteraction() {
        const { score, level, confidence, description } = this.currentRisk;
        
        this.showAlert(
            `📊 Risk Score: ${score}/100 | Confidence: ${Math.round(confidence)}% | ${description}`,
            level === 'scam' ? 'error' : level === 'suspicious' ? 'warning' : 'success'
        );
        
        this.triggerHapticFeedback('light');
        
        // Show performance overlay briefly
        const perfOverlay = document.getElementById('performance-overlay');
        if (perfOverlay) {
            perfOverlay.classList.remove('hidden');
            setTimeout(() => perfOverlay.classList.add('hidden'), 3000);
        }
    }
    
    // === AUDIO VISUALIZATION ===
    
    startAudioVisualization() {
        const audioRing = document.getElementById('audio-ring');
        if (audioRing) {
            audioRing.classList.add('active');
        }
    }
    
    stopAudioVisualization() {
        const audioRing = document.getElementById('audio-ring');
        if (audioRing) {
            audioRing.classList.remove('active');
        }
    }
    
    updateProtectionStatus(status) {
        const statusElement = document.getElementById('protection-status');
        if (!statusElement) return;
        
        const statusText = statusElement.querySelector('.status-text');
        const statusConfig = {
            'protected': { text: 'Protected', class: 'protected' },
            'monitoring': { text: 'Monitoring', class: 'monitoring' },
            'analyzing': { text: 'Analyzing', class: 'analyzing' }
        };
        
        const config = statusConfig[status] || statusConfig.protected;
        if (statusText) statusText.textContent = config.text;
        statusElement.className = `protection-status ${config.class}`;
    }
    
    // === DEMO CALL SIMULATION ===
    
    startRandomDemoCall() {
        if (!this.isMonitoring) return;
        
        // Select appropriate scenario based on language
        const languageScenarios = this.demoScenarios.filter(s => s.language === this.settings.language);
        const allScenarios = languageScenarios.length > 0 ? languageScenarios : this.demoScenarios;
        
        const scenario = allScenarios[Math.floor(Math.random() * allScenarios.length)];
        this.startDemoCall(scenario);
    }
    
    async startDemoCall(scenario) {
        console.log(`📞 Starting demo call: ${scenario.title}`, scenario);
        
        if (!scenario || !scenario.messages) {
            console.error('❌ Invalid scenario data:', scenario);
            this.showAlert('❌ Demo scenario data is invalid', 'error');
            return;
        }
        
        this.currentCall = scenario;
        this.callStartTime = Date.now();
        
        // Show call information
        this.showCallInfo(scenario);
        this.updateProtectionStatus('analyzing');
        this.updateAnalysisStatus('Recording...');
        this.clearTranscript();
        
        // Start call timer
        this.startCallTimer();
        
        // Play scenario messages
        await this.playScenarioMessages(scenario.messages);
        
        // End call after completion
        setTimeout(() => {
            if (this.currentCall === scenario) {
                this.endCurrentCall();
            }
        }, 2000);
    }
    
    async playScenarioMessages(messages) {
        for (let i = 0; i < messages.length; i++) {
            if (!this.isMonitoring || !this.currentCall) break;
            
            const message = messages[i];
            const startTime = Date.now();
            
            // Wait for message timestamp
            if (i > 0) {
                const delay = message.timestamp - messages[i-1].timestamp;
                await this.sleep(delay);
            } else if (message.timestamp > 0) {
                await this.sleep(message.timestamp);
            }
            
            if (!this.isMonitoring || !this.currentCall) break;
            
            // Calculate processing latency
            const processingTime = Date.now() - startTime;
            this.performance.latency = Math.max(100, processingTime + Math.random() * 300);
            
            // Update risk level
            const riskLevel = this.getRiskLevel(message.risk);
            this.updateRiskDialer(message.risk, riskLevel);
            
            // Add message to transcript
            this.addTranscriptMessage(message);
            
            // Show alerts for high-risk content
            if (message.risk >= this.settings.scam_threshold) {
                this.showAlert('🚨 SCAM DETECTED: High-risk patterns identified', 'scam');
                this.performance.scamsDetected++;
                
            } else if (message.risk >= this.settings.suspicious_threshold) {
                this.showAlert('⚠️ SUSPICIOUS: Potentially risky content detected', 'warning');
            }
            
            // Auto-expand transcript for high-risk messages
            if (message.risk >= this.settings.scam_threshold && !this.touchState.panelExpanded) {
                this.expandTranscriptPanel();
            }
        }
    }
    
    endCurrentCall() {
        if (!this.currentCall) return;
        
        console.log(`📞 Ending call: ${this.currentCall.title}`);
        
        this.currentCall = null;
        this.callStartTime = null;
        
        // Hide call info
        this.hideCallInfo();
        
        // Stop call timer
        if (this.callTimer) {
            clearInterval(this.callTimer);
            this.callTimer = null;
        }
        
        // Update status
        this.updateAnalysisStatus('Call ended');
        
        // Schedule next call if monitoring continues
        if (this.isMonitoring) {
            this.updateProtectionStatus('monitoring');
            setTimeout(() => {
                if (this.isMonitoring) {
                    this.startRandomDemoCall();
                }
            }, 5000 + Math.random() * 10000); // 5-15 second delay
        } else {
            this.updateProtectionStatus('protected');
        }
    }
    
    startCallTimer() {
        if (this.callTimer) clearInterval(this.callTimer);
        
        this.callTimer = setInterval(() => {
            if (!this.callStartTime) return;
            
            const elapsed = Math.floor((Date.now() - this.callStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            
            const timerElement = document.getElementById('call-timer');
            if (timerElement) {
                timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }
    
    showCallInfo(scenario) {
        const callOverlay = document.getElementById('call-overlay');
        const callerNumber = document.getElementById('caller-number');
        
        if (callOverlay) callOverlay.classList.remove('hidden');
        
        if (callerNumber) {
            // Generate realistic phone numbers based on scenario risk
            const numbers = {
                'legitimate_insurance': '+1 (555) 123-4567',
                'suspicious_bank': 'Unknown Number',
                'irs_scam': '+1 (202) 555-0123',
                'spanish_bank_scam': '+34 555 123 456',
                'french_tax_scam': '+33 1 55 12 34 56',
                'legitimate_customer_service': '+33 800 123 456'
            };
            callerNumber.textContent = numbers[scenario.id] || '+1 (555) 000-0000';
        }
    }
    
    hideCallInfo() {
        const callOverlay = document.getElementById('call-overlay');
        if (callOverlay) callOverlay.classList.add('hidden');
    }
    
    // === TRANSCRIPT MANAGEMENT ===
    
    toggleTranscriptPanel() {
        if (this.touchState.panelExpanded) {
            this.collapseTranscriptPanel();
        } else {
            this.expandTranscriptPanel();
        }
    }
    
    expandTranscriptPanel() {
        const panel = document.getElementById('transcript-panel');
        if (panel) {
            panel.classList.add('expanded');
            this.touchState.panelExpanded = true;
            this.triggerHapticFeedback('light');
        }
    }
    
    collapseTranscriptPanel() {
        const panel = document.getElementById('transcript-panel');
        if (panel) {
            panel.classList.remove('expanded');
            this.touchState.panelExpanded = false;
            this.triggerHapticFeedback('light');
        }
    }
    
    resetTranscriptPanel() {
        const panel = document.getElementById('transcript-panel');
        if (panel) {
            panel.style.transform = '';
        }
    }
    
    updateAnalysisStatus(status) {
        const statusElement = document.getElementById('analysis-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }
    
    clearTranscript() {
        const messagesContainer = document.getElementById('transcript-messages');
        const preview = document.getElementById('transcript-preview');
        
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        
        if (preview) {
            preview.innerHTML = '<div class="preview-message">Listening for voice activity...</div>';
        }
    }
    
    addTranscriptMessage(message) {
        const messagesContainer = document.getElementById('transcript-messages');
        const preview = document.getElementById('transcript-preview');
        
        if (!messagesContainer) return;
        
        // Create message element
        const messageEl = document.createElement('div');
        const riskLevel = this.getRiskLevel(message.risk);
        messageEl.className = `transcript-message ${message.speaker.toLowerCase()} ${riskLevel}`;
        
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        messageEl.innerHTML = `
            <div class="message-header">
                <span class="message-speaker">${message.speaker}</span>
                <span class="message-timestamp">${timeString}</span>
            </div>
            <div class="message-text">${message.text}</div>
            ${message.risk >= this.settings.suspicious_threshold ? 
                `<div class="message-risk ${riskLevel}">Risk: ${message.risk}/100 - ${message.analysis || 'Analysis pending'}</div>` 
                : ''
            }
        `;
        
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Update preview
        if (preview) {
            const truncatedText = message.text.length > 50 ? 
                message.text.substring(0, 50) + '...' : message.text;
            preview.innerHTML = `
                <div class="transcript-preview-content">
                    <strong>${message.speaker}:</strong> ${truncatedText}
                </div>
            `;
        }
    }
    
    // === MODAL MANAGEMENT ===
    
    showDemoModal() {
        const modal = document.getElementById('demo-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.triggerHapticFeedback('light');
        }
    }
    
    hideDemoModal() {
        const modal = document.getElementById('demo-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    populateDemoScenarios() {
        const scenarioList = document.getElementById('scenario-list');
        if (!scenarioList) return;
        
        scenarioList.innerHTML = '';
        
        this.demoScenarios.forEach(scenario => {
            const scenarioEl = document.createElement('div');
            scenarioEl.className = 'scenario-item';
            
            const riskLevel = this.getRiskLevel(scenario.maxRisk);
            
            scenarioEl.innerHTML = `
                <div class="scenario-header">
                    <div class="scenario-title">${scenario.title}</div>
                    <div class="scenario-risk-badge ${riskLevel}">
                        Risk ${scenario.maxRisk}
                    </div>
                </div>
                <div class="scenario-description">
                    ${scenario.description} (${scenario.language.toUpperCase()})
                </div>
            `;
            
            scenarioEl.addEventListener('click', () => {
                this.hideDemoModal();
                this.runDemoScenario(scenario);
            });
            
            scenarioList.appendChild(scenarioEl);
        });
    }
    
    runDemoScenario(scenario) {
        console.log('🎭 Running demo scenario:', scenario.title);
        
        if (!this.isMonitoring) {
            console.log('🎤 Starting monitoring for demo');
            this.toggleDemoMonitoring();
        }
        
        setTimeout(() => {
            console.log('🎬 Starting demo call');
            this.startDemoCall(scenario);
        }, 1000);
        
        this.showAlert(`🎭 Running demo: ${scenario.title}`, 'success');
    }
    
    showSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.triggerHapticFeedback('light');
        }
    }
    
    hideSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.showAlert('⚙️ Settings updated', 'success');
        }
    }
    
    // === SETTINGS MANAGEMENT ===
    
    setLanguage(languageCode) {
        this.settings.language = languageCode;
        
        // Update UI
        document.querySelectorAll('.language-option').forEach(option => {
            option.classList.toggle('active', option.dataset.lang === languageCode);
        });
        
        this.updateLanguageDisplay();
        
        const language = this.languages.find(l => l.code === languageCode);
        this.showAlert(`🌐 Language set to ${language?.name || languageCode}`, 'success');
        
        console.log(`🌐 Language changed to: ${languageCode}`);
    }
    
    toggleSetting(setting, toggleElement) {
        this.settings[setting] = !this.settings[setting];
        
        toggleElement.classList.toggle('active', this.settings[setting]);
        
        const settingNames = {
            'vibration': 'Haptic Feedback',
            'sound_alerts': 'Sound Alerts',
            'voice_alerts': 'Voice Guidance'
        };
        
        const status = this.settings[setting] ? 'enabled' : 'disabled';
        const name = settingNames[setting] || setting;
        
        this.showAlert(`⚙️ ${name} ${status}`, 'success');
        this.triggerHapticFeedback('light');
        
        console.log(`⚙️ Setting ${setting}: ${this.settings[setting]}`);
    }
    
    updateThreshold(type, value) {
        if (type === 'suspicious') {
            this.settings.suspicious_threshold = value;
            const display = document.getElementById('suspicious-display');
            if (display) display.textContent = value;
        } else if (type === 'scam') {
            this.settings.scam_threshold = value;
            const display = document.getElementById('scam-display');
            if (display) display.textContent = value;
        }
        
        // Re-evaluate current risk if applicable
        if (this.currentRisk.score > 0) {
            const newLevel = this.getRiskLevel(this.currentRisk.score);
            if (newLevel !== this.currentRisk.level) {
                this.updateRiskDialer(this.currentRisk.score, newLevel);
            }
        }
        
        this.showAlert(`⚙️ ${type} threshold: ${value}`, 'success');
        console.log(`⚙️ Threshold ${type}: ${value}`);
    }
    
    updateSettingsUI() {
        // Update language selection
        document.querySelectorAll('.language-option').forEach(option => {
            option.classList.toggle('active', option.dataset.lang === this.settings.language);
        });
        
        // Update toggle switches
        const toggles = {
            'vibration-toggle': this.settings.vibration,
            'sound-toggle': this.settings.sound_alerts,
            'voice-toggle': this.settings.voice_alerts
        };
        
        Object.entries(toggles).forEach(([id, active]) => {
            const toggle = document.getElementById(id);
            if (toggle) {
                toggle.classList.toggle('active', active);
            }
        });
        
        // Update threshold sliders
        const suspiciousRange = document.getElementById('suspicious-range');
        const scamRange = document.getElementById('scam-range');
        const suspiciousDisplay = document.getElementById('suspicious-display');
        const scamDisplay = document.getElementById('scam-display');
        
        if (suspiciousRange) suspiciousRange.value = this.settings.suspicious_threshold;
        if (scamRange) scamRange.value = this.settings.scam_threshold;
        if (suspiciousDisplay) suspiciousDisplay.textContent = this.settings.suspicious_threshold;
        if (scamDisplay) scamDisplay.textContent = this.settings.scam_threshold;
    }
    
    updateLanguageDisplay() {
        const indicator = document.getElementById('language-indicator');
        if (indicator) {
            indicator.textContent = this.settings.language.toUpperCase();
        }
    }
    
    // === ALERT SYSTEM ===
    
    showAlert(message, type = 'success') {
        const alert = document.getElementById('mobile-alert');
        const alertIcon = document.getElementById('alert-icon');
        const alertText = document.getElementById('alert-text');
        
        if (!alert || !alertIcon || !alertText) return;
        
        // Set alert content
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            scam: '🚨',
            info: 'ℹ️'
        };
        
        alertIcon.textContent = icons[type] || icons.info;
        alertText.textContent = message;
        
        // Update alert styling
        alert.className = `mobile-alert ${type}`;
        alert.classList.remove('hidden');
        
        // Auto-hide after appropriate duration
        const duration = type === 'scam' ? 8000 : type === 'error' ? 6000 : 4000;
        
        setTimeout(() => {
            this.hideAlert();
        }, duration);
        
        console.log(`🔔 Alert (${type}): ${message}`);
    }
    
    hideAlert() {
        const alert = document.getElementById('mobile-alert');
        if (alert) {
            alert.classList.add('hidden');
        }
    }
    
    // === FEEDBACK AND AUDIO ===
    
    triggerHapticFeedback(intensity = 'light') {
        if (!this.settings.vibration) return;
        
        // Try native vibration API
        if ('vibrate' in navigator) {
            const patterns = {
                light: 50,
                medium: [50, 30, 50],
                heavy: [100, 50, 100, 50, 100]
            };
            navigator.vibrate(patterns[intensity] || 50);
        }
        
        // Visual haptic feedback simulation
        const app = document.querySelector('.mobile-dialer-app');
        if (app) {
            const intensities = { light: 1, medium: 2, heavy: 3 };
            const magnitude = intensities[intensity] || 1;
            
            app.style.transform = `translateX(${magnitude}px)`;
            setTimeout(() => {
                app.style.transform = `translateX(-${magnitude}px)`;
                setTimeout(() => {
                    app.style.transform = '';
                }, 25);
            }, 25);
        }
    }
    
    playAlertSound(type) {
        if (!this.settings.sound_alerts) return;
        
        // Create audio context for alert sounds
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Configure based on alert type
            const config = {
                scam: { frequency: 880, duration: 200, volume: 0.3 },
                warning: { frequency: 660, duration: 150, volume: 0.2 },
                success: { frequency: 440, duration: 100, volume: 0.1 }
            };
            
            const { frequency, duration, volume } = config[type] || config.success;
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        } catch (e) {
            console.warn('Audio context not available:', e);
        }
    }
    
    speakAlert(text) {
        if (!this.settings.voice_alerts || !('speechSynthesis' in window)) return;
        
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = 0.7;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        
        // Set language if available
        if (this.settings.language !== 'en') {
            const langCodes = { es: 'es-ES', fr: 'fr-FR' };
            utterance.lang = langCodes[this.settings.language] || 'en-US';
        }
        
        speechSynthesis.speak(utterance);
    }
    
    // === PERFORMANCE MONITORING ===
    
    updatePerformanceMetrics() {
        // Simulate realistic performance metrics
        this.performance.accuracy = Math.min(95, 85 + Math.random() * 10);
        
        const latencyEl = document.getElementById('latency-value');
        const accuracyEl = document.getElementById('accuracy-value');
        
        if (latencyEl) latencyEl.textContent = `${Math.round(this.performance.latency)}ms`;
        if (accuracyEl) accuracyEl.textContent = `${Math.round(this.performance.accuracy)}%`;
    }
    
    // === UTILITY FUNCTIONS ===
    
    animateNumberChange(element, from, to, duration) {
        if (!element) return;
        
        const startTime = Date.now();
        const change = to - from;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.round(from + change * easeOutCubic);
            
            element.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    handleOrientationChange() {
        // Reset transcript panel position after orientation change
        this.resetTranscriptPanel();
        
        // Update performance metrics display
        setTimeout(() => {
            this.updatePerformanceMetrics();
        }, 300);
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // === BACKEND INTEGRATION ===

    async checkBackendStatus() {
        const statusElement = document.getElementById('backend-status');
        const statusLabel = document.getElementById('status-label');
        
        if (statusElement) statusElement.className = 'backend-status checking';
        if (statusLabel) statusLabel.textContent = 'Checking...';
        
        try {
            this.backendAvailable = await this.api.checkHealth();
            
            if (this.backendAvailable) {
                if (statusElement) statusElement.className = 'backend-status online';
                if (statusLabel) statusLabel.textContent = 'Backend Online';
                console.log('✅ Backend is available');
                
                // Show real-time button if microphone is supported
                this.updateRealtimeButtonVisibility();
            } else {
                throw new Error('Backend health check failed');
            }
        } catch (error) {
            this.backendAvailable = false;
            if (statusElement) statusElement.className = 'backend-status offline';
            if (statusLabel) statusLabel.textContent = 'Backend Offline';
            console.log('❌ Backend is offline, using demo mode');
            
            // Hide real-time button when backend is offline
            this.updateRealtimeButtonVisibility();
        }
    }

    async handleFileUpload(file) {
        if (!file) return;
        
        console.log('📁 File selected:', file.name);
        
        if (!this.backendAvailable) {
            this.showAlert('❌ Backend is offline. Please start the backend server first.', 'error');
            return;
        }
        
        // Validate file type
        const validTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/m4a', 'audio/ogg'];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(wav|mp3|m4a|ogg)$/i)) {
            this.showAlert('❌ Please select a valid audio file (WAV, MP3, M4A, OGG)', 'error');
            return;
        }
        
        // Check file size (limit to 50MB)
        if (file.size > 50 * 1024 * 1024) {
            this.showAlert('❌ File too large. Please select a file smaller than 50MB.', 'error');
            return;
        }
        
        await this.analyzeUploadedFile(file);
    }

    async analyzeUploadedFile(file) {
        try {
            // Show loading state
            this.setUploadButtonLoading(true);
            this.clearTranscript();
            this.updateAnalysisStatus('Uploading file...');
            
            // Upload file
            this.showAlert('📤 Uploading file for analysis...', 'info');
            const uploadResult = await this.api.uploadFile(file);
            console.log('Upload result:', uploadResult);
            
            if (uploadResult.error) {
                throw new Error(uploadResult.detail || 'Upload failed');
            }
            
            const fileId = uploadResult.file_id;
            this.updateAnalysisStatus('Processing audio...');
            
            // Analyze the file
            this.showAlert('🔍 Analyzing audio with AI...', 'info');
            const analysisResult = await this.api.analyzeAudio(fileId, {
                asrMode: 'local',
                model: 'tiny'
            });
            console.log('Analysis result:', analysisResult);
            
            if (analysisResult.error) {
                throw new Error(analysisResult.error);
            }
            
            // Process and display results
            await this.displayAnalysisResults(analysisResult);
            
            this.showAlert('✅ Analysis completed successfully!', 'success');
            
        } catch (error) {
            console.error('File analysis error:', error);
            this.showAlert(`❌ Analysis failed: ${error.message}`, 'error');
            this.updateAnalysisStatus('Analysis failed');
        } finally {
            this.setUploadButtonLoading(false);
        }
    }

    async displayAnalysisResults(analysisResult) {
        // Format the analysis results
        const formatted = this.api.formatAnalysisResult(analysisResult);
        
        // Update risk dialer
        const riskLevel = this.getRiskLevel(formatted.riskScore);
        this.updateRiskDialer(formatted.riskScore, riskLevel);
        
        // Create transcript messages
        let messages = this.api.createTranscriptMessages(analysisResult.transcript || []);
        messages = this.api.calculateMessageRisks(messages, analysisResult.flagged_segments || []);
        
        // Display transcript
        this.clearTranscript();
        for (const message of messages) {
            await this.sleep(200); // Small delay for visual effect
            this.addTranscriptMessage(message);
        }
        
        // Expand transcript panel if high risk
        if (formatted.riskScore >= this.settings.scam_threshold) {
            this.expandTranscriptPanel();
            
            // Show detailed alert for scam detection
            this.showAlert(`🚨 SCAM DETECTED! Risk Score: ${formatted.riskScore}/100`, 'scam');
            
            if (this.settings.voice_alerts) {
                this.speakAlert('Warning! Potential scam detected in the audio file.');
            }
        } else if (formatted.riskScore >= this.settings.suspicious_threshold) {
            this.showAlert(`⚠️ Suspicious content detected. Risk Score: ${formatted.riskScore}/100`, 'warning');
        }
        
        // Update analysis status
        this.updateAnalysisStatus(`Analysis complete - ${riskLevel.toUpperCase()}`);
        
        console.log('📊 Analysis Results:', formatted);
    }

    setUploadButtonLoading(loading) {
        const uploadBtn = document.getElementById('upload-btn');
        if (uploadBtn) {
            uploadBtn.classList.toggle('loading', loading);
            uploadBtn.disabled = loading;
            
            const icon = uploadBtn.querySelector('.btn-icon');
            if (icon) {
                icon.textContent = loading ? '⏳' : '📁';
            }
        }
    }

    // Override the original toggleMonitoring to support both modes
    async toggleMonitoring() {
        // Check if real-time monitoring is supported and backend is available
        if (this.backendAvailable && this.realTimeMonitor && RealTimeVoiceMonitor.isSupported()) {
            await this.toggleRealTimeMonitoring();
        } else {
            // Fallback to demo mode
            if (this.backendAvailable) {
                this.showAlert('🎭 Demo mode - Real-time requires microphone support', 'info');
            } else {
                this.showAlert('🎭 Demo mode - Backend offline', 'info');
            }
            this.toggleDemoMonitoring();
        }
    }

    // New real-time monitoring toggle
    async toggleRealTimeMonitoring() {
        if (!this.isMonitoring) {
            // Start real-time monitoring
            const success = await this.realTimeMonitor.startRealTimeMonitoring();
            if (success) {
                this.isMonitoring = true;
                this.updateMonitoringUI(true, 'realtime');
                this.updateProtectionStatus('monitoring');
                this.startAudioVisualization();
            }
        } else {
            // Stop real-time monitoring
            this.realTimeMonitor.stopRealTimeMonitoring();
            this.isMonitoring = false;
            this.updateMonitoringUI(false, 'realtime');
            this.updateProtectionStatus('protected');
            this.stopAudioVisualization();
            this.clearTranscript();
            this.updateRiskDialer(0, 'safe');
        }
    }

    // Update monitoring UI for different modes
    updateMonitoringUI(isActive, mode = 'demo') {
        const monitorBtn = document.getElementById('monitor-btn');
        const monitorIcon = document.getElementById('monitor-icon');
        const monitorText = document.getElementById('monitor-text');
        
        if (isActive) {
            monitorBtn?.classList.add('monitoring');
            if (monitorIcon) monitorIcon.textContent = '⏹️';
            if (monitorText) {
                monitorText.textContent = mode === 'realtime' ? 'Stop Live' : 'Stop Demo';
            }
        } else {
            monitorBtn?.classList.remove('monitoring');
            if (monitorIcon) monitorIcon.textContent = '🎤';
            if (monitorText) {
                monitorText.textContent = mode === 'realtime' ? 'Start Live' : 'Start Demo';
            }
        }
    }

    toggleDemoMonitoring() {
        this.isMonitoring = !this.isMonitoring;
        
        if (this.isMonitoring) {
            // Start monitoring
            this.updateMonitoringUI(true, 'demo');
            
            this.updateProtectionStatus('monitoring');
            this.startAudioVisualization();
            this.showAlert('🎤 Demo monitoring activated - scenarios will start soon', 'success');
            
            // Trigger haptic feedback
            this.triggerHapticFeedback('medium');
            
            // Start demo call simulation with more visible feedback
            console.log('🎬 Demo monitoring started, scheduling first scenario...');
            setTimeout(() => {
                if (this.isMonitoring) {
                    console.log('🎬 Starting first demo scenario...');
                    this.startRandomDemoCall();
                } else {
                    console.log('🛑 Demo monitoring was stopped, canceling scenario');
                }
            }, 3000);
            
        } else {
            // Stop monitoring
            this.updateMonitoringUI(false, 'demo');
            
            this.updateProtectionStatus('protected');
            this.stopAudioVisualization();
            this.endCurrentCall();
            this.showAlert('⏹️ Demo monitoring stopped', 'success');
            
            // Reset UI after delay
            setTimeout(() => {
                this.updateRiskDialer(0, 'safe');
                this.clearTranscript();
                this.updateAnalysisStatus('Waiting');
            }, 1500);
        }
        
        this.performance.totalCalls += this.isMonitoring ? 0 : 1;
    }

    // Update real-time button visibility based on capabilities
    updateRealtimeButtonVisibility() {
        const realtimeBtn = document.getElementById('realtime-btn');
        if (realtimeBtn) {
            const shouldShow = this.backendAvailable && 
                             this.realTimeMonitor && 
                             RealTimeVoiceMonitor.isSupported();
            
            realtimeBtn.style.display = shouldShow ? 'flex' : 'none';
            
            if (shouldShow) {
                console.log('🎙️ Real-time monitoring available');
            } else {
                console.log('❌ Real-time monitoring not available');
            }
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Voice Scam Shield Mobile - Starting...');
    
    const app = new VoiceScamMobileApp();
    
    // Make app globally accessible for debugging
    window.VoiceScamShield = app;
    
    // Global error handler
    window.addEventListener('error', (e) => {
        console.error('🚨 Application Error:', e.error);
        if (app.showAlert) {
            app.showAlert('⚠️ An error occurred. Please refresh the page.', 'error');
        }
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (e) => {
        console.error('🚨 Unhandled Promise Rejection:', e.reason);
        e.preventDefault();
    });
    
    // Performance monitoring
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                const loadTime = Math.round(perfData.loadEventEnd - perfData.loadEventStart);
                console.log(`⚡ App loaded in ${loadTime}ms`);
                
                if (loadTime > 3000) {
                    console.warn('⚠️ Slow loading detected');
                }
            }, 100);
        });
    }
    
    console.log('✅ Voice Scam Shield Mobile - Initialized');
});
