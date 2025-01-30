import React from 'react';

interface HelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const Help: React.FC<HelpProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">How to Use Speech to Text</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close help"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <section>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Quick Start</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Click the "Start Listening" button to begin speech recognition</li>
                <li>Speak clearly into your microphone</li>
                <li>Click "Stop Listening" when you're done</li>
                <li>Your text will appear in the text area below</li>
              </ol>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Features</h3>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Speech Bubbles:</strong> Show real-time transcription (gray) and final results (blue)</li>
                <li><strong>Auto-copy:</strong> Automatically copies final text to your clipboard</li>
                <li><strong>Manual Copy:</strong> Use the clipboard icon to copy all text</li>
                <li><strong>Dark Mode:</strong> Toggle between light and dark themes</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Voice Commands</h3>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>"stop listening"</strong> - Stops the recording</li>
                <li><strong>"clear clear"</strong> - Clears all text</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Tips</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Speak clearly and at a normal pace</li>
                <li>Use a good quality microphone for better results</li>
                <li>Allow microphone access when prompted</li>
                <li>Check the status indicator to ensure it's listening</li>
              </ul>
            </section>

            <section className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-blue-800 dark:text-blue-200">Privacy Note</h3>
              <p className="text-blue-700 dark:text-blue-300">
                This tool uses your browser's built-in speech recognition service (Google's servers for Chrome/Edge, Apple's for Safari). 
                Audio is processed through these services to provide transcription. The resulting text stays in your browser, but the audio processing is not done locally.
                This tool is not HIPAA compliant, so please do not share any sensitive information.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
