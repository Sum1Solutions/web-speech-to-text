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
    }

    async initService(type) {
        // Clean up existing service if any
        if (this.currentService) {
            this.currentService.disconnect();
        }

        this.serviceType = type;
        
        try {
            switch (type) {
                case SpeechServiceType.WEB_SPEECH:
                    this.currentService = WebSpeechService;
                    break;
                case SpeechServiceType.LOCAL_OLLAMA:
                    if (!await this.checkOllamaAvailable()) {
                        throw new Error('Ollama is not installed. Please install Ollama first to use local speech recognition.');
                    }
                    this.currentService = LocalSpeechService;
                    break;
                default:
                    throw new Error(`Unknown service type: ${type}`);
            }

            await this.currentService.init();
            await this.currentService.connect();
            
            return true;
        } catch (error) {
            console.error('Error initializing speech service:', error);
            throw error;
        }
    }

    async checkOllamaAvailable() {
        try {
            // In Docker environment, we'll check if we can reach the Ollama service
            const ollamaUrl = process.env.REACT_APP_OLLAMA_URL || 'http://localhost:11434';
            return fetch(`${ollamaUrl}/api/health`)
                .then(response => response.ok)
                .catch(() => false);
        } catch (error) {
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
                name: 'Web Speech API',
                description: 'Browser\'s built-in speech recognition (Not HIPAA Compliant)',
                hipaaCompliant: false,
                setupRequired: false
            },
            [SpeechServiceType.LOCAL_OLLAMA]: {
                name: 'Local Ollama',
                description: 'Local machine processing using Ollama (HIPAA Compliant)',
                hipaaCompliant: true,
                setupRequired: true,
                setupInstructions: `
To enable HIPAA-compliant local processing:

1. Install Docker Desktop from https://www.docker.com/products/docker-desktop
2. Run the following commands in your terminal:
   ./start.sh

3. Wait for the services to start (this may take a few minutes)
4. Click "Connect" to start using local processing
                `
            }
        };

        return Object.entries(info).map(([key, value]) => ({
            id: key,
            ...value
        }));
    }
}

const speechServiceFactory = new SpeechServiceFactory();
export default speechServiceFactory;
