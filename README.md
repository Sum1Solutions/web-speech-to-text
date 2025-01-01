# Web Speech-to-Text

A modern, privacy-focused speech recognition application built with React. Offers both cloud-based and HIPAA-compliant local processing options.

## Key Features

- Real-time speech-to-text transcription
- HIPAA-compliant local processing option
- Browser-based cloud processing option
- Automatic clipboard copy
- Real-time transcription bubbles
- Dark mode support
- Voice commands
- Mobile-responsive design

## Processing Options

### 1. Web Speech API (Default)
- Zero setup required
- Fast, real-time processing
- Uses cloud services:
  - Chrome: Google's servers
  - Edge: Microsoft's servers
- Not HIPAA compliant
- Best for general use

### 2. Local Processing (HIPAA Compliant)
- 100% private - runs entirely on your machine
- HIPAA compliant
- Customizable with medical-specific models
- Requires local setup
- Uses Ollama with Whisper model
- Ideal for medical/healthcare settings

## Prerequisites

- Node.js 14+
- npm or yarn
- For local processing:
  - Python 3.8+
  - [Ollama](https://ollama.ai)

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/Sum1Solutions/web-speech-to-text.git
   cd web-speech-to-text
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React app:
   ```bash
   npm start
   ```

4. Open http://localhost:3000 in Chrome or Edge

## HIPAA Compliance Setup

To use the HIPAA-compliant local processing:

1. Install Ollama:
   ```bash
   # macOS/Linux
   curl https://ollama.ai/install.sh | sh
   
   # For other platforms, visit: https://ollama.ai/download
   ```

2. Pull the Whisper model:
   ```bash
   ollama pull whisper
   ```

3. Set up the Python server:
   ```bash
   cd server
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python server.py
   ```

4. In the web app:
   - Select "Local Ollama" from the processing options dropdown
   - All processing will now happen locally

## Usage Guide

### Basic Usage
1. Choose processing method:
   - Web Speech API: Fast, cloud-based (default)
   - Local Ollama: Private, HIPAA-compliant
2. Click "Start Listening" or press Space
3. Speak naturally
4. View real-time transcription
5. Text automatically copies to clipboard

### Voice Commands
- "stop listening" - Stops recording
- "clear clear" - Erases all text

### Keyboard Shortcuts
- Space: Start/Stop listening
- Ctrl/Cmd + C: Copy text
- Ctrl/Cmd + X: Clear all

## Development

### Branch Strategy
- `main`: Production-ready code
- `feature/*`: New features
- `bugfix/*`: Bug fixes

### Current Branches
- `main`: Stable release
- `feature/hipaa-compliant-local-processing`: HIPAA compliance implementation

### Testing
```bash
npm test
```

## Deployment

### Standard Deployment
1. Build the production version:
   ```bash
   npm run build
   ```
2. Deploy the `build` folder to your hosting service

### HIPAA-Compliant Deployment
For medical/healthcare settings:
1. Deploy on private infrastructure
2. Ensure server runs locally
3. Configure firewall rules
4. Implement access controls
5. Set up audit logging

## Privacy & Security

### Data Handling
- Web Speech API:
  - Audio processed on Google/Microsoft servers
  - No data stored permanently
  - Subject to cloud provider privacy policies

- Local Processing:
  - All data stays on your machine
  - No external connections
  - Compliant with HIPAA requirements
  - Suitable for sensitive information

### Security Recommendations
1. Use Local Processing for medical data
2. Keep Ollama and dependencies updated
3. Implement access controls
4. Monitor system logs
5. Regular security audits

## Contributing

1. Fork the repository
2. Create your feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. Push to the branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- [Documentation](docs/)
- [Issue Tracker](issues/)
- [Discussions](discussions/)
- [Contact Us](mailto:support@example.com)
