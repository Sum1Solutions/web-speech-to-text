# Web Speech-to-Text

A modern, dual-mode speech recognition application that offers both cloud-based and HIPAA-compliant local processing options. Built with React and designed for reliability and privacy.

## Key Features

- **Dual Processing Modes**:
  - Web Speech API (Cloud-based, available on Cloudflare)
  - Local Processing (HIPAA-compliant, using Ollama)
- **Real-time Transcription**:
  - Instant feedback with transcription bubbles
  - Automatic punctuation and formatting (on Microsoft Edge only)
- **User Experience**:
  - Dark/Light mode support
  - Mobile-responsive design
  - Automatic clipboard copy
  - Spacebar shortcut for quick start/stop
- **Privacy & Security**:
  - Option for complete local processing
  - No data storage or transmission (in local mode)
  - HIPAA-compliant option available

## Deployment Options

### 1. Cloud Deployment (via Cloudflare)
- Accessible at: [talkudoc.com](https://talkudoc.com)
- Features browser's Web Speech API
- Automatically deployed via CI
- For general use
- No setup required

### 2. Local Development
```bash
npm install
npm start
```
- Runs on http://localhost:3000
- Uses browser's Web Speech API
- Great for development and testing

### 3. HIPAA-Compliant Local Processing
```bash
./start.sh --full
```
- Runs completely locally
- Uses Ollama for speech recognition
- No data leaves your machine
- Requires Docker

## Architecture

### Cloud Version (Cloudflare)
- React frontend hosted on Cloudflare
- Uses browser's native Web Speech API
- No backend required
- Automatic deployment via CI

### Local Processing Version
- React frontend
- FastAPI WebSocket server
- Ollama for speech recognition
- Docker containerization
- Local network only

## Mode Comparison

| Feature                    | Cloud (Cloudflare) | Local Processing |
|---------------------------|-------------------|------------------|
| Setup Required            | None              | Docker + Ollama  |
| Privacy                   | Standard          | HIPAA-Compliant  |
| Processing Speed          | Fast              | Variable         |
| Internet Required         | Yes               | No               |
| Automatic Updates         | Yes               | Manual           |

## Local Development Prerequisites

- Node.js 14+
- npm
- Docker Desktop (for local processing mode)

## Quick Start

### Cloud Version
1. Visit [talkudoc.com](https://talkudoc.com)
2. Allow microphone (and optional clipboard) access if you plan to paste your transcription into another window.
3. Start speaking and pasting!

### Local Development
```bash
# Start with Web Speech API
npm install
npm start

# For HIPAA-compliant local processing
./start.sh --full
```

## Configuration

### Environment Variables
- `REACT_APP_API_URL`: WebSocket server URL (local processing mode)
- `REACT_APP_DEFAULT_MODE`: Default transcription mode

## Browser Support

- Chrome
- Edge (Recommended) - has auto punctuation, is faster, and picks up many different accents better than Chrome.
- Firefox ?
- Safari ?