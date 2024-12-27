import React, { useState, useRef, useEffect } from 'react';

const SpeechToText = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [collectedText, setCollectedText] = useState('');
  const [autoCopy, setAutoCopy] = useState(true);
  const [showBubbles, setShowBubbles] = useState(true);
  const processedResultsRef = useRef(new Set());
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      const isFinal = event.results[current].isFinal;
      
      // Check for "clear clear" command
      if (isFinal && transcript.trim().toLowerCase() === "clear clear") {
        setTranscripts([]);
        setCollectedText("");
        processedResultsRef.current.clear();
        return;
      }
      
      // Create a unique identifier for this result
      const resultId = `${current}-${transcript}`;
      
      setTranscripts(prev => {
        const newTranscripts = [...prev];
        if (newTranscripts.length > 0 && !isFinal) {
          newTranscripts[newTranscripts.length - 1] = transcript;
        } else {
          newTranscripts.push(transcript);
          // Only update collected text if this is a new final result
          if (isFinal && !processedResultsRef.current.has(resultId)) {
            processedResultsRef.current.add(resultId);
            setCollectedText(prevText => {
              const newText = prevText + (prevText ? ' ' : '') + transcript;
              // Use setTimeout to ensure the state has updated before selecting
              setTimeout(() => {
                if (textareaRef.current && autoCopy) {
                  textareaRef.current.select();
                  navigator.clipboard.writeText(newText).then(() => {
                    console.log('Text copied to clipboard');
                  }).catch(err => {
                    console.error('Failed to copy text: ', err);
                  });
                }
              }, 0);
              return newText;
            });
          }
        }
        return newTranscripts;
      });
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [autoCopy]);

  const startListening = () => {
    if (recognitionRef.current) {
      processedResultsRef.current.clear(); // Reset the processed results set
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return (
    <div className="flex flex-col h-screen p-4 bg-gray-100 dark:bg-gray-800">
      <div className="flex-1 overflow-y-auto mb-4 space-y-2">
        {showBubbles && transcripts.map((text, index) => (
          <div key={index} className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow text-gray-800 dark:text-gray-200">
            {text}
          </div>
        ))}
      </div>

      <textarea
        ref={textareaRef}
        value={collectedText}
        onChange={(e) => setCollectedText(e.target.value)}
        className="w-full p-3 mb-4 rounded-lg shadow bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 resize-none"
        rows={4}
        placeholder="Transcribed text will appear here..."
      />
      
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 italic">
        While listening, say "clear clear" to reset the transcription
      </div>
      
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center space-x-2 text-gray-800 dark:text-gray-200">
          <input
            type="checkbox"
            checked={autoCopy}
            onChange={(e) => setAutoCopy(e.target.checked)}
            className="form-checkbox h-5 w-5"
          />
          <span>Auto-copy on update</span>
        </label>
        <label className="flex items-center space-x-2 text-gray-800 dark:text-gray-200">
          <input
            type="checkbox"
            checked={showBubbles}
            onChange={(e) => setShowBubbles(e.target.checked)}
            className="form-checkbox h-5 w-5"
          />
          <span>Show transcription bubbles</span>
        </label>
      </div>

      <button
        className={`px-6 py-3 rounded-full font-bold text-white transition-colors ${
          isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
        }`}
        onClick={() => isListening ? stopListening() : startListening()}
      >
        {isListening ? 'Stop Listening' : 'Click to Listen'}
      </button>
    </div>
  );
};

export default SpeechToText;
