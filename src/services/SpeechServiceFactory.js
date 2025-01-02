import WebSpeechService from './WebSpeechService';
import LocalSpeechService from './AudioService';

export const SpeechServiceType = {
    WEB_SPEECH: 'WEB_SPEECH',
    LOCAL_OLLAMA: 'LOCAL_OLLAMA'
};

class SpeechServiceFactory {
    constructor() {
        this.currentService = null;
        this.serviceType = SpeechServiceType.WEB_SPEECH;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 3;
    }

    async initService(type) {
        // Clean up existing service if any
        if (this.currentService) {
            await this.currentService.disconnect();
            this.currentService = null;
        }

        this.serviceType = type;
        this.connectionAttempts = 0;
        
        try {
            switch (type) {
                case SpeechServiceType.WEB_SPEECH:
                    this.currentService = WebSpeechService;
                    break;
                case SpeechServiceType.LOCAL_OLLAMA:
                    const isOllamaAvailable = await this.checkOllamaAvailable();
                    console.log('Ollama availability check result:', isOllamaAvailable);
                    if (!isOllamaAvailable) {
                        throw new Error('Cannot connect to Ollama service. Please make sure you have run "./start.sh --full" and the service is running.');
                    }
                    this.currentService = LocalSpeechService;
                    break;
                default:
                    throw new Error(`Unknown service type: ${type}`);
            }

            // Initialize service first
            await this.currentService.init();
            
            // Then attempt connection with retry logic
            await this.attemptConnection();
            
            return true;
        } catch (error) {
            console.error('Error initializing speech service:', error);
            // Don't reset currentService here - let the caller handle fallback
            throw error;
        }
    }
    
    async attemptConnection() {
        while (this.connectionAttempts < this.maxConnectionAttempts) {
            try {
                this.connectionAttempts++;
                console.log(`Attempting connection (${this.connectionAttempts}/${this.maxConnectionAttempts})...`);
                
                await this.currentService.connect();
                console.log('Connection successful');
                return;
            } catch (error) {
                console.error(`Connection attempt ${this.connectionAttempts} failed:`, error);
                
                if (this.connectionAttempts >= this.maxConnectionAttempts) {
                    throw new Error('Failed to establish connection after multiple attempts');
                }
                
                // Wait before retrying, but only for local service
                if (this.serviceType === SpeechServiceType.LOCAL_OLLAMA) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, this.connectionAttempts - 1)));
                } else {
                    // For web speech, fail fast
                    throw error;
                }
            }
        }
    }

    async checkOllamaAvailable() {
        try {
            // Always use localhost in the browser
            const ollamaUrl = 'http://localhost:11434';
            console.log('Checking Ollama availability at:', ollamaUrl);
            const response = await fetch(`${ollamaUrl}/api/tags`);
            if (!response.ok) {
                console.error('Ollama check failed:', response.status, response.statusText);
                return false;
            }
            const data = await response.json();
            console.log('Ollama check successful:', data);
            return true;
        } catch (error) {
            console.error('Error checking Ollama availability:', error);
            return false;
        }
    }

    getCurrentService() {
        return this.currentService;
    }

    getServiceType() {
        return this.serviceType;
    }

    getServiceInfo() {
        const info = {
            [SpeechServiceType.WEB_SPEECH]: {
                name: 'Web Transcription',
                description: 'Browser\'s built-in speech recognition (Not HIPAA Compliant)',
                hipaaCompliant: false,
                setupRequired: false
            },
            [SpeechServiceType.LOCAL_OLLAMA]: {
                name: 'Local Transcription',
                description: 'Local machine processing using Ollama (HIPAA Compliant)',
                hipaaCompliant: true,
                setupRequired: true,
                setupInstructions: `
To enable HIPAA-compliant local processing:

1. Install Docker Desktop from https://www.docker.com/products/docker-desktop
2. Run the following commands in your terminal:
   ./start.sh --full

3. Wait for the services to start (this may take a few minutes)
4. Click "Done" to start using local processing
                `
            }
        };

        return Object.entries(info).map(([id, data]) => ({
            id,
            ...data
        }));
    }
}

const speechServiceFactory = new SpeechServiceFactory();
export default speechServiceFactory;
