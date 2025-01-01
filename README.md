# Web Speech-to-Text

A browser-based speech recognition application built with React, offering both cloud-based and local processing options.

## Features

- Real-time speech-to-text transcription
- Multiple processing options:
  - Web Speech API (browser-based, not HIPAA compliant)
  - Local Ollama processing (HIPAA compliant, runs entirely on your machine)
- Auto-copy text to clipboard
- Real-time transcription bubbles (optional)
- Dark mode support
- Voice commands ("stop listening", "clear clear")
- Mobile-responsive design

## Privacy & Processing Options

### Web Speech API (Default)
- Uses browser's built-in speech recognition
- Audio processed by:
  - Chrome: Google's servers
  - Edge: Microsoft's servers
- Not HIPAA compliant
- No setup required
- Faster processing
- Includes automatic punctuation in Edge

### Local Ollama Processing
- Runs entirely on your local machine
- HIPAA compliant
- No data leaves your computer
- Requires local setup
- May be slower than cloud processing
- Customizable with medical-specific models

## Requirements

- Node.js 14+ and npm
- Microsoft Edge or Google Chrome
- For local processing:
  - Ollama installed locally
  - Python 3.8+

## Quick Start

1. Clone and enter the repository:
```bash
git clone https://github.com/Sum1Solutions/web-speech-to-text.git
cd web-speech-to-text
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) For local processing:
```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Pull the Whisper model
ollama pull whisper

# Set up the Python server
cd server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

4. Start the React app:
```bash
npm start
```

5. Open http://localhost:3000 in Edge or Chrome

## Usage

1. Select your preferred processing method:
   - Web Speech API: Default, cloud-based processing
   - Local Ollama: Private, HIPAA-compliant processing
2. Click "Start Listening" to begin transcription
3. Speak clearly - transcription appears in real-time
4. Text is automatically copied to clipboard (can be disabled)
5. Click "Stop Listening" or say "stop listening" to stop
6. Use "clear clear" voice command or click "Clear All" to reset

## Voice Commands
- "stop listening" - Stops the transcription
- "clear clear" - Clears all transcribed text

## Deployment

### Cloudflare Pages
1. Push code to GitHub
2. Connect repository in Cloudflare Pages
3. Use build settings:
   - Framework preset: Create React App
   - Build command: npm run build
   - Build output directory: build

Note: For HIPAA compliance, deploy on your own infrastructure with appropriate security measures.
