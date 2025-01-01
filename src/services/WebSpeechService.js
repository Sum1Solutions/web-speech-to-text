class WebSpeechService {
    constructor() {
        this.recognition = null;
        this.onTranscriptionCallback = null;
        this.isListening = false;
    }

    async init() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                throw new Error('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
            }

            // Create new instance each time to ensure clean state
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 1;

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
                if (event.error === 'not-allowed') {
                    this.isListening = false;
                }
                if (this.onTranscriptionCallback) {
                    this.onTranscriptionCallback({
                        error: this.getErrorMessage(event.error)
                    });
                }
            };

            this.recognition.onend = () => {
                if (this.isListening) {
                    // Small delay before restarting to prevent rapid restarts
                    setTimeout(() => {
                        try {
                            this.recognition.start();
                        } catch (err) {
                            console.error('Error restarting recognition:', err);
                            this.isListening = false;
                            if (this.onTranscriptionCallback) {
                                this.onTranscriptionCallback({
                                    error: 'Recognition stopped unexpectedly'
                                });
                            }
                        }
                    }, 100);
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
        
        try {
            await this.recognition.start();
        } catch (err) {
            if (!err.message.includes('already started')) {
                this.isListening = false;
                throw err;
            }
        }
    }

    stopRecording() {
        this.isListening = false;
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (err) {
                console.error('Error stopping recognition:', err);
            }
        }
        this.onTranscriptionCallback = null;
    }

    disconnect() {
        this.stopRecording();
        this.recognition = null;
    }
}

const webSpeechService = new WebSpeechService();
export default webSpeechService;
