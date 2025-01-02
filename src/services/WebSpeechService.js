class WebSpeechService {
    constructor() {
        this.recognition = null;
        this.onTranscriptionCallback = null;
        this.isListening = false;
        this.restartTimeout = null;
        this.lastStartTime = null;
        this.minRestartDelay = 300; // Minimum delay between restarts in ms
    }

    async init() {
        try {
            // Try Microsoft Cognitive Services first for Edge
            const SpeechRecognition = 
                window.SpeechRecognition || 
                window.webkitSpeechRecognition ||
                window.msSpeechRecognition;

            if (!SpeechRecognition) {
                throw new Error('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
            }

            // Create new instance each time to ensure clean state
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 1;

            this.recognition.onstart = () => {
                console.log('Speech recognition started');
                this.lastStartTime = Date.now();
            };

            this.recognition.onresult = (event) => {
                if (this.onTranscriptionCallback) {
                    const current = event.resultIndex;
                    const transcript = event.results[current][0].transcript;
                    const isFinal = event.results[current].isFinal;
                    
                    this.onTranscriptionCallback({
                        text: transcript,
                        isFinal,
                        resultId: `${current}-${transcript}`
                    });
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                
                // Don't treat no-speech as an error, just restart
                if (event.error === 'no-speech') {
                    return;
                }
                
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    this.isListening = false;
                }
                
                if (this.onTranscriptionCallback) {
                    this.onTranscriptionCallback({
                        error: this.getErrorMessage(event.error)
                    });
                }
            };

            this.recognition.onend = () => {
                console.log('Speech recognition ended');
                
                if (this.isListening) {
                    // Calculate time since last start
                    const timeSinceStart = this.lastStartTime ? Date.now() - this.lastStartTime : Infinity;
                    
                    // Use a longer delay if we just started to prevent rapid restarts
                    const delay = Math.max(this.minRestartDelay, 
                        timeSinceStart < 1000 ? 1000 : 100);
                    
                    // Clear any existing timeout
                    if (this.restartTimeout) {
                        clearTimeout(this.restartTimeout);
                    }
                    
                    // Set new timeout for restart
                    this.restartTimeout = setTimeout(() => {
                        if (!this.isListening) return;
                        
                        try {
                            console.log('Restarting speech recognition...');
                            this.recognition.start();
                        } catch (err) {
                            console.error('Error restarting recognition:', err);
                            // Only set error if it's not already restarting
                            if (!err.message.includes('already started')) {
                                this.isListening = false;
                                if (this.onTranscriptionCallback) {
                                    this.onTranscriptionCallback({
                                        error: 'Recognition stopped unexpectedly'
                                    });
                                }
                            }
                        }
                    }, delay);
                }
            };

            return true;
        } catch (error) {
            console.error('Error initializing WebSpeechService:', error);
            throw error;
        }
    }

    getErrorMessage(error) {
        switch (error) {
            case 'not-allowed':
                return 'Microphone access denied. Please allow microphone access and try again.';
            case 'service-not-allowed':
                return 'Speech recognition service is not available. Please try again later.';
            case 'no-speech':
                return 'No speech detected. Please try again.';
            case 'network':
                return 'Network error occurred. Please check your internet connection.';
            case 'aborted':
                return 'Speech recognition was aborted.';
            case 'audio-capture':
                return 'No microphone was found. Ensure that a microphone is installed.';
            case 'language-not-supported':
                return 'The selected language is not supported.';
            default:
                return `Speech recognition error: ${error}`;
        }
    }

    async connect() {
        return this.init();
    }

    async startRecording(onTranscription) {
        if (!this.recognition) {
            await this.init();
        }
        
        this.onTranscriptionCallback = onTranscription;
        this.isListening = true;
        this.lastStartTime = null;
        
        try {
            await this.recognition.start();
        } catch (err) {
            // Only throw if it's not already started
            if (!err.message.includes('already started')) {
                this.isListening = false;
                throw err;
            }
        }
    }

    stopRecording() {
        this.isListening = false;
        
        if (this.restartTimeout) {
            clearTimeout(this.restartTimeout);
            this.restartTimeout = null;
        }
        
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (err) {
                console.error('Error stopping recognition:', err);
            }
        }
        
        this.onTranscriptionCallback = null;
        this.lastStartTime = null;
    }

    disconnect() {
        this.stopRecording();
        this.recognition = null;
    }
}

const webSpeechService = new WebSpeechService();
export default webSpeechService;
