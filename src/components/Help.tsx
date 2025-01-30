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
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Speech to Text Help</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close help"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <section className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg border-l-4 border-yellow-500">
              <h3 className="text-lg font-semibold mb-2 text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                <span>🔒</span> Privacy Notice
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300">
                Audio is processed through your browser's speech service (Google for Chrome/Edge, Apple for Safari). 
                Text stays in your browser, but audio processing happens on external servers. Not suitable for sensitive information.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span>🎯</span> Quick Start
              </h3>
              <ol className="list-none space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">1.</span> Click "Start Listening"
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">2.</span> Speak into your microphone
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">3.</span> Text appears in real-time
                </li>
              </ol>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span>⚡</span> Features
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">💬</span> Live transcription bubbles
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">📋</span> Auto-copy to clipboard
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">🌙</span> Dark mode support
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">🎤</span> Voice commands
                </li>
              </ul>
              <div className="mt-3 flex items-start gap-2 text-sm bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                <span className="text-blue-500">💡</span>
                <p className="text-blue-700 dark:text-blue-300">
                  Using Edge browser? It automatically adds punctuation to your speech!
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span>🗣️</span> Voice Commands
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">🛑</span> Say "stop listening" to stop
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">🗑️</span> Say "clear clear" to reset
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span>💡</span> Tips
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">🎙️</span> Use a good microphone
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">🔊</span> Speak clearly at normal speed
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">✅</span> Allow microphone access
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
