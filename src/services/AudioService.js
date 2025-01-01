class AudioService {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.ws = null;
        this.onTranscriptionCallback = null;
        this.isConnected = false;
    }

    async init() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                    this.sendAudioData();
                }
            };

            return true;
        } catch (error) {
            console.error('Error initializing audio:', error);
            return false;
        }
    }

    async connect() {
        if (this.ws) {
            this.ws.close();
        }

        return new Promise((resolve, reject) => {
            this.ws = new WebSocket('ws://localhost:8000/ws');

            this.ws.onopen = () => {
                this.isConnected = true;
                resolve();
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (this.onTranscriptionCallback) {
                    this.onTranscriptionCallback(data);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.isConnected = false;
                reject(error);
            };

            this.ws.onclose = () => {
                this.isConnected = false;
            };
        });
    }

    async sendAudioData() {
        if (!this.isConnected || this.audioChunks.length === 0) return;

        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const arrayBuffer = await blob.arrayBuffer();
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        this.ws.send(base64Data);
        this.audioChunks = [];
    }

    startRecording(onTranscription) {
        this.onTranscriptionCallback = onTranscription;
        this.audioChunks = [];
        this.mediaRecorder.start(1000); // Send chunks every second
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        this.onTranscriptionCallback = null;
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
    }
}

export default new AudioService();
