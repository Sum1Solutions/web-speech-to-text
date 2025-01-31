import React from 'react';
import { ShieldCheckIcon, ClipboardDocumentIcon, Cog6ToothIcon, MicrophoneIcon, SpeakerWaveIcon, LightBulbIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface HelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const Help: React.FC<HelpProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold dark:text-gray-100">Help & Information</h1>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close help"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <div className="space-y-6">
          {/* Privacy Notice */}
          <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg shadow border-l-4 border-yellow-500">
            <h2 className="text-lg font-bold flex items-center gap-2 text-yellow-800 dark:text-yellow-200 mb-2">
              <ShieldCheckIcon className="h-5 w-5" />
              ⚠️ Privacy & HIPAA Warning
            </h2>
            <p className="text-yellow-700 dark:text-yellow-300">
              This application is <span className="font-semibold">not HIPAA compliant</span>. The browser sends audio for remote processing on servers that are not covered by a Business Associates Agreement (BAA).
            </p>
            <ul className="mt-2 ml-4 list-disc text-yellow-700 dark:text-yellow-300">
              <li>Do not disclose any Protected Health Information (PHI)</li>
              <li>Do not share any sensitive information</li>
            </ul>
          </div>

          {/* Features Section */}
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-gray-100">
              <Cog6ToothIcon className="h-5 w-5" />
              Features
            </h2>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded dark:text-gray-100">
                <div className="flex items-center gap-2 font-medium">
                  <MicrophoneIcon className="h-4 w-4" />
                  Voice Commands
                </div>
                <ul className="mt-1 text-sm space-y-1">
                  <li>"Clear Clear" - Erase all text</li>
                  <li>"Stop Listening" - Stop recording</li>
                </ul>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded dark:text-gray-100">
                <div className="flex items-center gap-2 font-medium">
                  <SpeakerWaveIcon className="h-4 w-4" />
                  Speech Bubbles
                </div>
                <p className="mt-1 text-sm">
                  Toggle to show/hide real-time transcription bubbles
                </p>
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-gray-100">
              <LightBulbIcon className="h-5 w-5" />
              Tips
            </h2>
            <ul className="mt-2 space-y-2 text-sm dark:text-gray-100">
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                Speak clearly and at a natural pace
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                Click the microphone button again to restart if recognition stops
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                Microsoft's Edge browser will auto punctuate
              </li>
            </ul>
          </div>

          {/* Key Features Section - Highlighting Auto-copy */}
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-green-700 dark:text-green-100">
              <ClipboardDocumentIcon className="h-5 w-5" />
              Auto-Copy for EHR Integration
            </h2>
            <p className="mt-2 text-sm text-green-600 dark:text-green-100">
              Enable "Auto-copy" to automatically copy transcribed text to the clipboard to facilitate pasting into another text box.
              (Be sure to avoid any PHI in your dictation!)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
