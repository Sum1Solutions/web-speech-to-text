# Web Speech-to-Text

A browser-based speech recognition application built with React and the Web Speech API.

## Features

- Real-time speech-to-text transcription
- Push-to-talk interface
- Mobile-responsive design
- No backend required - uses browser's built-in Web Speech API

## Requirements

- Node.js 14+ and npm
- Chrome/Edge browser (recommended for Web Speech API support)

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

3. Start development server:
```bash
npm start
```

4. Open http://localhost:3000 in Chrome or Edge

## Usage

1. Press and hold the "Hold to Speak" button
2. Speak clearly - transcription appears in real-time
3. Release to stop recording

## Deployment

### Cloudflare Pages
1. Push code to GitHub
2. Connect repository in Cloudflare Pages
3. Use build settings:
   - Framework preset: Create React App
   - Build command: npm run build
   - Build output directory: build

## Browser Support

Best supported in Chromium-based browsers (Chrome, Edge). Limited or no support in other browsers.
