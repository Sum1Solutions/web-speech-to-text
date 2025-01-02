class AudioService {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.ws = null;
        this.onTranscriptionCallback = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectTimeout = null;
        this.stream = null;
        this.isRecording = false;
        this.lastPingSent = null;
        this.lastPongReceived = null;
        this.pingInterval = null;
        this.pongTimeout = null;
    }

    async init() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(this.stream);
            
            this.mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > 0 && this.isRecording) {
                    this.audioChunks.push(event.data);
                    await this.sendAudioData().catch(console.error);
                }
            };

            return true;
        } catch (error) {
            console.error('Error initializing audio:', error);
            throw error;
        }
    }

    startPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        
        // Send ping every 10 seconds
        this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.lastPingSent = Date.now();
                this.ws.send(JSON.stringify({ type: 'ping' }));
                
                // Set timeout for pong response
                if (this.pongTimeout) {
                    clearTimeout(this.pongTimeout);
                }
                this.pongTimeout = setTimeout(() => {
                    if (Date.now() - this.lastPongReceived > 30000) { // No pong for 30 seconds
                        console.log('No pong received, reconnecting...');
                        this.reconnect();
                    }
                }, 15000); // Wait 15 seconds for pong
            }
        }, 10000);
    }

    stopPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        if (this.pongTimeout) {
            clearTimeout(this.pongTimeout);
            this.pongTimeout = null;
        }
    }

    async connect() {
        if (this.ws) {
            this.ws.close();
        }

        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket('ws://localhost:5001/ws');

                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.lastPongReceived = Date.now();
                    this.startPingInterval();
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        
                        // Handle ping/pong
                        if (data.type === 'ping') {
                            this.ws.send(JSON.stringify({ type: 'pong' }));
                            return;
                        } else if (data.type === 'pong') {
                            this.lastPongReceived = Date.now();
                            return;
                        }
                        
                        if (this.onTranscriptionCallback) {
                            this.onTranscriptionCallback(data);
                        }
                    } catch (error) {
                        console.error('Error processing WebSocket message:', error);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.isConnected = false;
                    reject(error);
                };

                this.ws.onclose = (event) => {
                    console.log('WebSocket closed:', event.code, event.reason);
                    this.isConnected = false;
                    this.stopPingInterval();
                    if (this.isRecording) {
                        this.attemptReconnect();
                    }
                };
            } catch (error) {
                console.error('Error creating WebSocket:', error);
                reject(error);
            }
        });
    }

    reconnect() {
        if (this.ws) {
            this.ws.close();
        }
        this.attemptReconnect();
    }

    attemptReconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            this.reconnectTimeout = setTimeout(() => {
                this.connect().catch(error => {
                    console.error('Reconnection attempt failed:', error);
                });
            }, delay);
        } else {
            console.error('Max reconnection attempts reached');
            if (this.onTranscriptionCallback) {
                this.onTranscriptionCallback({
                    error: 'Connection lost. Please try again.',
                    isFinal: true
                });
            }
            this.stopRecording();
        }
    }

    async sendAudioData() {
        if (!this.isConnected || this.audioChunks.length === 0 || !this.isRecording) return;

        try {
            const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
            const arrayBuffer = await blob.arrayBuffer();
            const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(base64Data);
                this.audioChunks = [];
            }
        } catch (error) {
            console.error('Error sending audio data:', error);
            if (this.onTranscriptionCallback) {
                this.onTranscriptionCallback({
                    error: 'Failed to process audio data',
                    isFinal: true
                });
            }
        }
    }

    startRecording(onTranscription) {
        this.onTranscriptionCallback = onTranscription;
        this.audioChunks = [];
        this.isRecording = true;
        if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
            this.mediaRecorder.start(1000); // Send chunks every second
        }
    }

    stopRecording() {
        this.isRecording = false;
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        this.onTranscriptionCallback = null;
        this.audioChunks = [];
    }

    disconnect() {
        this.stopRecording();
        this.stopPingInterval();
        
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        // Stop all audio tracks
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        this.isConnected = false;
        this.reconnectAttempts = 0;
    }
}

const audioService = new AudioService();
export default audioService;
