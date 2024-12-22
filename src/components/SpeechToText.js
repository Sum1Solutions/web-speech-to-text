import React, { useState, useRef, useEffect } from 'react';

const SpeechToText = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const recognitionRef = useRef(null);

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
      
      setTranscripts(prev => {
        const newTranscripts = [...prev];
        if (newTranscripts.length > 0 && !event.results[current].isFinal) {
          newTranscripts[newTranscripts.length - 1] = transcript;
        } else {
          newTranscripts.push(transcript);
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
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
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
        {transcripts.map((text, index) => (
          <div key={index} className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow text-gray-800 dark:text-gray-200">
            {text}
          </div>
        ))}
      </div>
      
      <button
        className={`px-6 py-3 rounded-full font-bold text-white transition-colors ${
          isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
        }`}
        onMouseDown={startListening}
        onMouseUp={stopListening}
        onMouseLeave={stopListening}
      >
        {isListening ? 'Listening...' : 'Hold to Speak'}
      </button>
    </div>
  );
};

export default SpeechToText;
