# Speech-to-Text Web Application

A modern, accessible, and production-ready speech-to-text application built with React and TypeScript. This application allows users to convert speech to text in real-time using the Web Speech API.

## Features

- 🎤 Real-time speech-to-text conversion
- 📋 Automatic clipboard copying
- 🔄 Continuous speech recognition
- 🗣️ Voice commands support
- 🌙 Dark mode support
- ♿ Full accessibility support
- 🌐 TypeScript for enhanced type safety
- 🛡️ Error boundary for graceful error handling
- 📱 Responsive design

## Voice Commands

- Say "clear clear" to reset all transcriptions
- Say "stop listening" to pause speech recognition

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- A modern web browser that supports the Web Speech API (Chrome recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/web-speech-to-text.git
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

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── components/
│   ├── ErrorBoundary.tsx    # Error handling component
│   └── SpeechToText.tsx     # Main speech-to-text component
├── hooks/
│   └── useSpeechRecognition.ts    # Custom hook for speech recognition
├── types/
│   └── web-speech-api.d.ts  # TypeScript definitions for Web Speech API
├── App.tsx
└── index.tsx
```

## ⚠️ Important Notice: Not HIPAA Compliant

**WARNING**: This application is NOT HIPAA compliant. Do not use it to process, store, or transmit any Protected Health Information (PHI) or other sensitive medical data. The application uses browser-based speech recognition and clipboard features that are not secured for medical data handling.

- Do not disclose any patient information
- Do not include any personal health information
- Use only for general, non-sensitive information
- Consider this tool as a general-purpose transcription utility only

## Technical Details

### TypeScript Integration

- Full TypeScript support with proper type definitions
- Custom type definitions for the Web Speech API
- Type-safe event handling and error management

### Custom Hook: useSpeechRecognition

The `useSpeechRecognition` hook encapsulates all speech recognition logic, providing:
- Type-safe speech recognition setup
- Error handling with detailed error messages
- Cleanup on component unmount
- Voice command processing

### Error Handling

- Comprehensive error boundary implementation
- Detailed error messages for common issues:
  - Microphone access denied
  - Network errors
  - Browser compatibility issues
  - Recognition service errors

### Accessibility

- ARIA labels and roles
- Keyboard navigation support
- Clear visual feedback
- Screen reader friendly
- High contrast mode support

## Browser Support

This application uses the Web Speech API, which has varying support across browsers:
- Chrome: Full support
- Edge: Full support
- Firefox: Partial support
- Safari: Limited support

For best results, use Google Chrome or Microsoft Edge.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React and TypeScript
- Uses the Web Speech API
- Styled with Tailwind CSS
