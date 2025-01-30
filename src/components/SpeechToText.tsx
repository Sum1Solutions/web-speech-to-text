import React, { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react';
import { debounce } from 'lodash';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

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

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    setCollectedText("");
    processedResultsRef.current.clear();
    setError(null);
  }, []);

  const copyToClipboard = useCallback(async (text: string = collectedText) => {
    if (!text) return;
    
    try {
      if (autoCopy || text === collectedText) {
        await navigator.clipboard.writeText(text);
        
        if (textareaRef.current) {
          textareaRef.current.style.backgroundColor = '#4ade80';
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.style.backgroundColor = '';
            }
          }, 200);
        }
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setError('Failed to copy text to clipboard');
    }
  }, [collectedText, autoCopy]);

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
        stopListening();
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
          if (autoCopy) {
            copyToClipboard(newText);
          }
          return newText;
        });
      }
      return newTranscripts;
    });
  }, [autoCopy, clearTranscripts, copyToClipboard]);

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

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    onResult: handleSpeechResult,
    onError: handleSpeechError,
    onEnd: () => {}
  });

  const handleAutoCopyChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setAutoCopy(e.target.checked);
  }, []);

  const handleShowBubblesChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setShowBubbles(e.target.checked);
  }, []);

  const handleTextAreaChange = debounce((e: ChangeEvent<HTMLTextAreaElement>) => {
    setCollectedText(e.target.value);
  }, DEBOUNCE_DELAY);

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
      className="flex flex-col h-screen max-h-screen p-4 bg-gray-100 dark:bg-gray-800"
      role="application"
      aria-label="Speech to Text Converter"
    >
      {/* Status Bar */}
      <div 
        className="flex items-center justify-between mb-4 text-sm"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2">
          <div 
            className={`h-3 w-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}
            role="presentation"
          />
          <span className="text-gray-600 dark:text-gray-300">
            {isListening ? 'Listening...' : 'Microphone off'}
          </span>
        </div>
      </div>

      {error && (
        <div 
          className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      {/* HIPAA Warning */}
      <div 
        className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg shadow text-sm border-l-4 border-yellow-500"
        role="alert"
      >
        <h3 className="font-bold mb-2 text-yellow-800 dark:text-yellow-200">⚠️ Not HIPAA Compliant</h3>
        <p className="text-yellow-700 dark:text-yellow-300 mb-2">
          This tool is not HIPAA compliant. Do not disclose any Protected Health Information (PHI) or sensitive medical data.
        </p>
        <p className="text-yellow-600 dark:text-yellow-400 text-xs">
          For medical practices: Use HIPAA-compliant solutions for patient information.
        </p>
      </div>

      {/* Transcripts */}
      <div 
        ref={transcriptsContainerRef}
        className="flex-1 overflow-y-auto mb-4 space-y-2 min-h-0"
      >
        {showBubbles && transcripts.map((transcript, index) => (
          <div 
            key={index} 
            className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow text-gray-800 dark:text-gray-200 break-words"
          >
            {transcript.text}
          </div>
        ))}
      </div>

      {/* Main Text Area */}
      <div className="relative mb-4 flex-shrink-0">
        <textarea
          ref={textareaRef}
          value={collectedText}
          onChange={handleTextAreaChange}
          className="w-full p-3 rounded-lg shadow bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 resize-none transition-colors duration-200"
          rows={4}
          placeholder="Transcribed text will appear here..."
          aria-label="Transcribed text"
          role="textbox"
        />
        <button
          onClick={() => copyToClipboard()}
          className="absolute right-2 top-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          title="Copy to clipboard"
          aria-label="Copy to clipboard"
        >
          📋
        </button>
      </div>
      
      {/* Instructions */}
      <div className="mb-4 p-4 bg-white dark:bg-gray-700 rounded-lg shadow text-sm">
        <h3 className="font-bold mb-2 text-gray-800 dark:text-gray-200">Quick Tips:</h3>
        <div className="space-y-2 text-gray-600 dark:text-gray-300">
          <ul className="list-disc list-inside space-y-1">
            <li>Click the button below to start/stop speech recognition</li>
            <li>Say "stop listening" to pause, or "clear clear" to reset</li>
            <li>Enable "Auto-copy" to automatically copy new text into your clipboard for pasting in your EHR</li>
            <li>Use the 📋 button to manually copy all text into clipboard</li>
          </ul>
        </div>
      </div>
      
      {/* Settings */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <label className="flex items-center space-x-2 text-gray-800 dark:text-gray-200 group relative">
            <input
              type="checkbox"
              id="autoCopy"
              checked={autoCopy}
              onChange={handleAutoCopyChange}
              className="form-checkbox h-5 w-5"
            />
            <span>Auto-copy</span>
            <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 p-2 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap">
              Automatically copy text into clipboard for pasting in your EHR
            </div>
          </label>
          <label className="flex items-center space-x-2 text-gray-800 dark:text-gray-200">
            <input
              type="checkbox"
              checked={showBubbles}
              onChange={handleShowBubblesChange}
              className="form-checkbox h-5 w-5"
            />
            <span>Show bubbles</span>
          </label>
        </div>
        <button
          onClick={clearTranscripts}
          className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Main Control Button */}
      <button
        className={`w-full sm:w-auto px-6 py-4 rounded-lg font-bold text-white transition-all transform active:scale-95 flex-shrink-0 ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600 shadow-lg' 
            : 'bg-blue-500 hover:bg-blue-600 shadow-lg'
        }`}
        onClick={isListening ? stopListening : startListening}
      >
        {isListening ? '⏹ Stop Listening' : '🎤 Start Listening'}
      </button>
    </div>
  );
};

export default SpeechToText;
