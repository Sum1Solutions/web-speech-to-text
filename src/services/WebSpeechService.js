class WebSpeechService {
    constructor() {
        this.recognition = null;
        this.onTranscriptionCallback = null;
        this.isListening = false;
    }

    async init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            throw new Error('Speech recognition is not supported in this browser.');
        }

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
            throw new Error(this.getErrorMessage(event.error));
        };

        this.recognition.onend = () => {
            if (this.isListening) {
                try {
                    this.recognition.start();
                } catch (err) {
                    if (!err.message.includes('already started')) {
                        throw new Error('Recognition stopped unexpectedly.');
                    }
                }
            }
        };

        return true;
    }

    getErrorMessage(error) {
        switch (error) {
            case 'not-allowed':
                return 'Microphone access denied. Please allow microphone access and try again.';
            case 'service-not-allowed':
                return 'Speech recognition service is not available. Please try again later.';
            case 'no-speech':
                return 'No speech detected. Please try again.';
            default:
                return `Speech recognition error: ${error}`;
        }
    }

    async connect() {
        return true; // Web Speech API doesn't need explicit connection
    }

    startRecording(onTranscription) {
        this.onTranscriptionCallback = onTranscription;
        this.isListening = true;
        try {
            this.recognition.start();
        } catch (err) {
            if (!err.message.includes('already started')) {
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
    }
}

export default new WebSpeechService();
