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
                hipaaCompliant: false
            },
            [SpeechServiceType.LOCAL_OLLAMA]: {
                name: 'Local Ollama',
                description: 'Local machine processing using Ollama (HIPAA Compliant)',
                hipaaCompliant: true
            }
        };

        return Object.entries(info).map(([key, value]) => ({
            id: key,
            ...value
        }));
    }
}

export default new SpeechServiceFactory();
