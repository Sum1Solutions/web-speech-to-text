import React, { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react';
import { debounce } from 'lodash';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import ThemeToggle from './ThemeToggle';

interface Transcript {
  text: string;
  isFinal: boolean;
}

const MAX_VISIBLE_BUBBLES = 10;
const DEBOUNCE_DELAY = 300;

const SpeechToText: React.FC = () => {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [collectedText, setCollectedText] = useState('');
  const [autoCopy, setAutoCopy] = useState(true);
  const [showBubbles, setShowBubbles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const processedResultsRef = useRef(new Set<string>());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transcriptsContainerRef = useRef<HTMLDivElement>(null);
  const shouldStopRef = useRef(false);

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    setCollectedText("");
    processedResultsRef.current.clear();
    setError(null);
  }, []);

  const copyToClipboard = useCallback(async (text: string = collectedText, force: boolean = false) => {
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
      const command = transcript.trim().toLowerCase();
      if (command === "clear clear") {
        clearTranscripts();
        return;
      }
      if (command === "stop listening") {
        shouldStopRef.current = true;
        return;
      }
    }
    
    const resultId = `${transcript}-${Date.now()}`;
    
    setTranscripts(prevTranscripts => {
      let newTranscripts = [...prevTranscripts];
      if (newTranscripts.length > 0 && !isFinal) {
        newTranscripts[newTranscripts.length - 1] = { text: transcript, isFinal };
      } else {
        newTranscripts.push({ text: transcript, isFinal });
        if (newTranscripts.length > MAX_VISIBLE_BUBBLES) {
          newTranscripts = newTranscripts.slice(-MAX_VISIBLE_BUBBLES);
        }
      }
      
      if (isFinal && !processedResultsRef.current.has(resultId)) {
        processedResultsRef.current.add(resultId);
        setCollectedText(prevText => {
          const newText = prevText + (prevText ? ' ' : '') + transcript;
          // Only attempt to copy if auto-copy is enabled
          if (autoCopy) {
            try {
              navigator.clipboard.writeText(newText).catch(() => {
                // Silently fail if auto-copy fails
                // Only show errors for manual copy attempts
              });
            } catch {
              // Catch any synchronous errors and ignore them for auto-copy
            }
          }
          return newText;
        });
      }
      return newTranscripts;
    });
  }, [autoCopy, clearTranscripts]);

  const handleAutoCopyChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setAutoCopy(e.target.checked);
  }, []);

  const handleTextAreaChange = debounce((e: ChangeEvent<HTMLTextAreaElement>) => {
    setCollectedText(e.target.value);
  }, DEBOUNCE_DELAY);

  const handleShowBubblesChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setShowBubbles(e.target.checked);
  }, []);

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    onResult: handleSpeechResult,
    onError: handleSpeechError,
    onEnd: () => {
      if (shouldStopRef.current) {
        shouldStopRef.current = false;
        stopListening();
      }
    }
  });

  // Scroll to bottom when new text is added to textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [collectedText]);

  // Scroll to bottom when new transcripts are added
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
        <ThemeToggle />
      </div>

      {/* HIPAA Warning */}
      <div 
        className="mb-4 p-3 sm:p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg shadow text-sm border-l-4 border-yellow-500"
        role="alert"
      >
        <h3 className="font-bold mb-2 text-yellow-800 dark:text-yellow-200">⚠️ Not HIPAA Compliant</h3>
        <p className="text-yellow-700 dark:text-yellow-300">
          This tool is not HIPAA compliant. Do not disclose any Protected Health Information (PHI) or sensitive medical data.
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
          onChange={handleTextAreaChange}
          className="w-full h-36 sm:h-48 p-3 sm:p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors text-sm sm:text-base"
          placeholder="Transcribed text will appear here..."
          aria-label="Transcribed text"
        />
        <button
          onClick={() => copyToClipboard(collectedText, true)}
          className="absolute right-2 top-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          title="Copy to clipboard"
          aria-label="Copy to clipboard"
        >
          📋
        </button>
      </div>
    </div>
  );
};

export default SpeechToText;
