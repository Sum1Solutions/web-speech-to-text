# Web Speech-to-Text

A simple, browser-based speech recognition application built with React and the Web Speech API.

## Features

- Real-time speech-to-text transcription
- Works in modern browsers (best support in Chrome/Edge)
- No backend required - uses browser's built-in Web Speech API
- Mobile-friendly interface
- Dark/light mode support

## Requirements

- Node.js 14+ and npm
- Modern web browser with Web Speech API support (Chrome recommended)

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

3. Start the development server:
   ```bash
   npm start
   ```

4. Open http://localhost:3000 in your browser

## Deployment

### Cloudflare Pages
1. Push your code to GitHub
2. Go to Cloudflare Dashboard > Pages
3. Create new project and select your repository
4. Use these build settings:
   - Framework preset: Create React App
   - Build command: npm run build
   - Build output directory: build

## Browser Support

This app uses the Web Speech API, which is best supported in Chromium-based browsers (Chrome, Edge, Opera). For production use, consider adding a fallback method for unsupported browsers.

## License

MIT License - feel free to use this in your own projects!
