import React, { useState, useRef, useEffect, useCallback } from 'react';

const MAX_VISIBLE_BUBBLES = 10;

const SpeechToText = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [collectedText, setCollectedText] = useState('');
  const [autoCopy, setAutoCopy] = useState(true);
  const [showBubbles, setShowBubbles] = useState(true);
  const [error, setError] = useState(null);
  const processedResultsRef = useRef(new Set());
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);
  const transcriptsContainerRef = useRef(null);

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    setCollectedText("");
    processedResultsRef.current.clear();
    setError(null);
  }, []);

  const stopListening = useCallback(() => {
    setError(null);
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    setIsListening(true);
  }, []);

  const copyToClipboard = useCallback(async (text = collectedText) => {
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

  const handleSpeechResult = useCallback((event) => {
    setError(null);
    const current = event.resultIndex;
    const transcript = event.results[current][0].transcript;
    const isFinal = event.results[current].isFinal;
    
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
    
    const resultId = `${current}-${transcript}`;
    
    setTranscripts(prevTranscripts => {
      let newTranscripts = [...prevTranscripts];
      if (newTranscripts.length > 0 && !isFinal) {
        newTranscripts[newTranscripts.length - 1] = transcript;
      } else {
        newTranscripts.push(transcript);
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
  }, [autoCopy, clearTranscripts, copyToClipboard, stopListening]);

  const handleSpeechError = useCallback((event) => {
    console.error('Speech recognition error:', event.error);
    if (event.error === 'not-allowed') {
      setError('Microphone access denied. Please allow microphone access and try again.');
    } else if (event.error === 'service-not-allowed') {
      setError('Speech recognition service is not available. Please try again later.');
    } else if (event.error === 'no-speech') {
      setError('Auto stopped listening. Click the button to restart listening.');
    } else {
      setError(`Speech recognition error: ${event.error}`);
    }
    setIsListening(false);
  }, []);

  const handleSpeechEnd = useCallback(() => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error restarting recognition:', err);
        setIsListening(false);
        setError('Recognition stopped unexpectedly. Please click Start Listening to begin again.');
      }
    }
  }, [isListening]);

  // Initialize recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = handleSpeechResult;
    recognition.onerror = handleSpeechError;
    recognition.onend = handleSpeechEnd;

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error('Error cleaning up recognition:', err);
        }
      }
    };
  }, [handleSpeechResult, handleSpeechError, handleSpeechEnd]);

  // Handle listening state changes
  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        if (!err.message.includes('already started')) {
          console.error('Error starting recognition:', err);
          setError('Failed to start speech recognition. Please try again.');
          setIsListening(false);
        }
      }
    } else {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
    }
  }, [isListening]);

  const handleAutoCopyChange = useCallback((e) => {
    setAutoCopy(e.target.checked);
  }, []);

  // Scroll to bottom when new transcripts are added
  useEffect(() => {
    if (transcriptsContainerRef.current && showBubbles) {
      transcriptsContainerRef.current.scrollTop = transcriptsContainerRef.current.scrollHeight;
    }
  }, [transcripts, showBubbles]);

  return (
    <div className="flex flex-col h-screen max-h-screen p-4 bg-gray-100 dark:bg-gray-800">
      {/* Status Bar */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-gray-600 dark:text-gray-300">
            {isListening ? 'Listening...' : 'Microphone off'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Transcripts */}
      <div 
        ref={transcriptsContainerRef}
        className="flex-1 overflow-y-auto mb-4 space-y-2 min-h-0"
      >
        {showBubbles && transcripts.map((text, index) => (
          <div 
            key={index} 
            className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow text-gray-800 dark:text-gray-200 break-words"
          >
            {text}
          </div>
        ))}
      </div>

      {/* Main Text Area */}
      <div className="relative mb-4 flex-shrink-0">
        <textarea
          ref={textareaRef}
          value={collectedText}
          onChange={(e) => setCollectedText(e.target.value)}
          className="w-full p-3 rounded-lg shadow bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 resize-none transition-colors duration-200"
          rows={4}
          placeholder="Transcribed text will appear here..."
        />
        <button
          onClick={() => copyToClipboard()}
          className="absolute right-2 top-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          title="Copy to clipboard"
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
              onChange={(e) => setShowBubbles(e.target.checked)}
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
