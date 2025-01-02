# Web Speech-to-Text

A modern, privacy-focused speech recognition application built with React. Choose from three deployment options based on your needs.

## Key Features

- Real-time speech-to-text transcription
- HIPAA-compliant local processing option
- Browser-based cloud processing option (not HIPAA-compliant)
- Automatic clipboard copy for easy pasting into your EHR
- Real-time transcription bubbles
- Dark and light mode support
- Voice commands
- Mobile-responsive design

## Deployment Options

### 1. Simple React App (Simplest)
- Just run `npm start`
- Uses browser's Web Speech API
- No Docker required
- Perfect for quick testing and development
```bash
cd packages/core
npm install
npm start
```

### 2. Dockerized Web App (Recommended)
- Containerized frontend
- Uses browser's Web Speech API
- Consistent environment across platforms
```bash
cd packages/docker
./start.sh
```

### 3. Full Local Processing (HIPAA-Compliant)
- Complete privacy with local processing
- Uses Ollama for speech recognition
- HIPAA-compliant
- Ideal for healthcare settings
```bash
cd packages/full
./start.sh
```

## Features by Version

| Feature                    | Simple | Docker | Full |
|---------------------------|---------|---------|------|
| Speech-to-Text            | ✅      | ✅      | ✅   |
| Real-time Transcription   | ✅      | ✅      | ✅   |
| Dark/Light Mode           | ✅      | ✅      | ✅   |
| Containerized             | ❌      | ✅      | ✅   |
| Local Processing          | ❌      | ❌      | ✅   |
| HIPAA Compliant           | ❌      | ❌      | ✅   |
| GPU Acceleration          | ❌      | ❌      | ✅   |

## Prerequisites

### Simple Version
- Node.js 14+
- npm or yarn

### Docker Version
- Docker Desktop
- Docker Compose

### Full Version
- Docker Desktop
- Docker Compose
- NVIDIA GPU (optional, for better performance)

## Quick Start with Docker (Recommended)

The easiest way to get started is using Docker:

1. Install Docker:
   - [Docker Desktop for Windows/Mac](https://www.docker.com/products/docker-desktop)
   - For Linux: `curl -fsSL https://get.docker.com | sh`

2. Run the application:
   ```bash
   # On Mac/Linux:
   ./start.sh

   # On Windows:
   # Double-click start.sh in File Explorer
   ```

3. Open http://localhost:3000 in your browser

That's it! The script will automatically:
- Check for Docker installation
- Pull the latest images
- Start all necessary services
- Set up HIPAA-compliant local processing

## Manual Setup (Alternative)

If you prefer to run without Docker:

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
- "stop listening" - Stops recording after the next line (only works with Chrome)
- "clear clear" - Erases all text in bubbles (only works with Chrome)

### Keyboard Shortcuts
- Space: Start/Stop listening
- Ctrl/Cmd + C: Copy text
- Ctrl/Cmd + X: Clear all

## Development

Each package can be developed independently:

- **core**: Basic React app with browser-based speech recognition
- **docker**: Adds containerization for consistent deployment
- **full**: Adds local processing with Ollama

See each package's README for specific development instructions.

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

## Contributing

1. Choose the appropriate package for your contribution
2. Make your changes
3. Submit a PR to the relevant package

## License

MIT License - See LICENSE file for details

## Support

- [Documentation](docs/)
- [Issue Tracker](issues/)
- [Discussions](discussions/)
- [Contact Us](mailto:support@example.com)
