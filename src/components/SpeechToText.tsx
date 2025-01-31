import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import ThemeToggle from './ThemeToggle';
import Help from './Help';

interface Transcript {
  text: string;
  isFinal: boolean;
}

const MAX_VISIBLE_BUBBLES = 10;

const SpeechToText: React.FC = () => {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [collectedText, setCollectedText] = useState('');
  const [autoCopy, setAutoCopy] = useState(true);
  const [showBubbles, setShowBubbles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const processedResultsRef = useRef(new Set<string>());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transcriptsContainerRef = useRef<HTMLDivElement>(null);
  const autoCopyRef = useRef(true);
  const stopListeningRef = useRef<() => void>(() => {});

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    setCollectedText("");
    processedResultsRef.current.clear();
    setError(null);
  }, []);

  const copyToClipboard = useCallback(async (text: string = collectedText) => {
    if (!text) return;
    
    try {
      await navigator.clipboard.writeText(text);
      if (textareaRef.current) {
        textareaRef.current.style.backgroundColor = '#4ade80';
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.style.backgroundColor = '';
          }
        }, 200);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setError('Failed to copy text to clipboard');
    }
  }, [collectedText]);

  const handleShowBubblesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setShowBubbles(e.target.checked);
  }, []);

  const handleSpeechError = useCallback((event: Event & { error: string; message: string }) => {
    console.error('Speech recognition error:', event.error);
    const errorMessages: Record<string, string> = {
      'not-allowed': 'Microphone access denied. Please allow microphone access and try again.',
      'service-not-allowed': 'Speech recognition service is not available. Please try again later.',
      'no-speech': 'No speech detected. Click the button to restart listening.',
      'network': 'Network error occurred. Attempting to reconnect...',
      'aborted': 'Speech recognition was aborted. Click to restart.',
      'audio-capture': 'No microphone was found. Please verify your audio input.',
      'bad-grammar': 'Grammar error occurred in speech recognition.',
      'language-not-supported': 'The selected language is not supported.',
      'start_error': 'Failed to start speech recognition. Please try again.'
    };

    const errorMessage = errorMessages[event.error] || `Speech recognition error: ${event.error}`;
    setError(errorMessage);
  }, []);

  const handleSpeechResult = useCallback((transcript: string, isFinal: boolean) => {
    setError(null);
    
    // Check for voice commands
    if (isFinal) {
      const normalizedText = transcript.toLowerCase().replace(/[.,!?]/g, '');
      
      // Check for "clear" command - both words must be present
      if (normalizedText.includes('clear') && 
          (normalizedText.match(/clear/g) || []).length >= 2) {
        clearTranscripts();
        return;
      }
      
      // Check for "stop listening" command - both words must be present
      if (normalizedText.includes('stop') && normalizedText.includes('listening')) {
        stopListeningRef.current?.();
        return;
      }

      // Update text area with final result if we haven't processed it
      if (!processedResultsRef.current.has(transcript)) {
        processedResultsRef.current.add(transcript);
        setCollectedText(prevText => prevText + (prevText ? ' ' : '') + transcript);
        if (autoCopyRef.current) {
          const newText = collectedText + (collectedText ? ' ' : '') + transcript;
          copyToClipboard(newText);
        }
      }
    }
    
    // Update transcripts bubbles
    setTranscripts(prevTranscripts => {
      let newTranscripts = [...prevTranscripts];
      
      // Handle interim results
      if (!isFinal) {
        // Update or add interim result
        if (newTranscripts.length > 0 && !newTranscripts[newTranscripts.length - 1].isFinal) {
          newTranscripts[newTranscripts.length - 1] = { text: transcript, isFinal };
        } else {
          newTranscripts.push({ text: transcript, isFinal });
        }
      } else {
        // Handle final result
        if (newTranscripts.length > 0 && !newTranscripts[newTranscripts.length - 1].isFinal) {
          // Replace last interim with final
          newTranscripts[newTranscripts.length - 1] = { text: transcript, isFinal: true };
        } else {
          // Add new final result
          newTranscripts.push({ text: transcript, isFinal: true });
        }
      }
      
      // Maintain max bubbles
      if (newTranscripts.length > MAX_VISIBLE_BUBBLES) {
        newTranscripts = newTranscripts.slice(-MAX_VISIBLE_BUBBLES);
      }
      
      return newTranscripts;
    });
  }, [clearTranscripts, collectedText, copyToClipboard]);

  const handleAutoCopyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newAutoCopy = e.target.checked;
    setAutoCopy(newAutoCopy);
    autoCopyRef.current = newAutoCopy;
    if (newAutoCopy && collectedText) {
      copyToClipboard(collectedText);
    }
  }, [collectedText, copyToClipboard]);

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    onResult: handleSpeechResult,
    onError: handleSpeechError,
    onEnd: () => {
      setError(null);
    }
  });

  useEffect(() => {
    stopListeningRef.current = stopListening;
  }, [stopListening]);

  useEffect(() => {
    autoCopyRef.current = autoCopy;
  }, [autoCopy]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [collectedText]);

  useEffect(() => {
    if (transcriptsContainerRef.current && showBubbles) {
      transcriptsContainerRef.current.scrollTop = transcriptsContainerRef.current.scrollHeight;
    }
  }, [transcripts, showBubbles]);

  return (
    <div 
      className="max-w-4xl mx-auto p-2 sm:p-4 space-y-4 bg-gray-100 dark:bg-gray-800"
      role="application"
      aria-label="Speech to Text Converter"
    >
      {/* Status Bar */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-400 dark:bg-gray-500'}`} />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {isListening ? 'Listening...' : 'Not listening'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button
            onClick={() => setIsHelpOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
            aria-label="Open help"
            title="How to use"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Help</span>
          </button>
        </div>
      </div>

      {/* HIPAA Warning */}
      <div 
        onClick={() => setIsHelpOpen(true)}
        className="mb-4 p-3 sm:p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg shadow text-sm border-l-4 border-yellow-500 cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-900/70 transition-colors"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsHelpOpen(true)}
        aria-label="Click for more information about privacy and data handling"
      >
        <h3 className="font-bold mb-2 text-yellow-800 dark:text-yellow-200">⚠️ Not HIPAA Compliant</h3>
        <p className="text-yellow-700 dark:text-yellow-300">
          This tool is not HIPAA compliant. Do not disclose any Protected Health Information (PHI) or sensitive data (medical or otherwise).
        </p>
      </div>

      {/* Transcripts */}
      {showBubbles && (
        <div 
          ref={transcriptsContainerRef}
          className="space-y-2 mb-4 max-h-60 overflow-y-auto p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          {transcripts.map((transcript, index) => (
            <div
              key={index}
              className={`p-2 sm:p-3 rounded-lg max-w-[85%] sm:max-w-[80%] text-sm sm:text-base ${
                transcript.isFinal
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {transcript.text}
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 items-start sm:items-center mb-4">
        <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
          <button
            onClick={() => (isListening ? stopListening() : startListening())}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium transition-colors ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isListening ? 'Stop' : 'Start'} Listening
          </button>

          <button
            onClick={clearTranscripts}
            className="flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Clear
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
            <input
              type="checkbox"
              checked={autoCopy}
              onChange={handleAutoCopyChange}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span>Auto-copy to clipboard</span>
          </label>

          <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
            <input
              type="checkbox"
              checked={showBubbles}
              onChange={handleShowBubblesChange}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span>Show speech bubbles</span>
          </label>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 sm:p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg mb-4 text-sm sm:text-base" role="alert">
          {error}
        </div>
      )}

      {/* Text Area */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={collectedText}
          readOnly={true}
          className="w-full h-36 sm:h-48 p-3 sm:p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors text-sm sm:text-base"
          placeholder="Transcribed text will appear here..."
          aria-label="Transcribed text"
        />
        <button
          onClick={() => copyToClipboard(collectedText)}
          className="absolute right-2 bottom-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Copy to clipboard"
          aria-label="Copy to clipboard"
        >
          📋
        </button>
      </div>

      {/* Help Modal */}
      <Help isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export default SpeechToText;
