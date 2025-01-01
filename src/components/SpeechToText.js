import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../theme/ThemeContext';
import SpeechServiceFactory, { SpeechServiceType } from '../services/SpeechServiceFactory';
import Modal from './Modal';

const MAX_VISIBLE_BUBBLES = 10;

const SpeechToText = () => {
  const { styles, isDarkMode, toggleDarkMode } = useTheme();
  const [isListening, setIsListening] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [collectedText, setCollectedText] = useState('');
  const [autoCopy, setAutoCopy] = useState(true);
  const [showBubbles, setShowBubbles] = useState(true);
  const [error, setError] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [serviceType, setServiceType] = useState(SpeechServiceType.WEB_SPEECH);
  const [serviceInfo, setServiceInfo] = useState([]);
  const [showSetupInstructions, setShowSetupInstructions] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [isCheckingLocalService, setIsCheckingLocalService] = useState(false);
  const processedResultsRef = useRef(new Set());
  const textareaRef = useRef(null);
  const transcriptsContainerRef = useRef(null);

  const copyToClipboard = useCallback((text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(console.error);
    } else {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.value = text;
        textarea.select();
        document.execCommand('copy');
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    setError(null);
    setIsListening(false);
    if (SpeechServiceFactory.getCurrentService()) {
      SpeechServiceFactory.getCurrentService().stopRecording();
    }
  }, []);

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    setCollectedText("");
    processedResultsRef.current.clear();
    setError(null);
  }, []);

  const handleTranscription = useCallback((data) => {
    setError(null);
    const { text, isFinal, error: transcriptionError } = data;
    
    if (transcriptionError) {
      setError(transcriptionError);
      return;
    }
    
    // Check for voice commands with normalized text
    if (isFinal) {
      const normalizedText = text.trim().toLowerCase()
        .replace(/[.,!?]/g, '') // Remove punctuation
        .replace(/\s+/g, ' '); // Normalize spaces
      
      if (normalizedText === "clear clear") {
        clearTranscripts();
        return;
      }
      if (normalizedText === "stop listening") {
        stopListening();
        return;
      }
    }
    
    setTranscripts(prevTranscripts => {
      let newTranscripts = [...prevTranscripts];
      if (newTranscripts.length > 0 && !isFinal) {
        newTranscripts[newTranscripts.length - 1] = text;
      } else {
        newTranscripts.push(text);
        if (newTranscripts.length > MAX_VISIBLE_BUBBLES) {
          newTranscripts = newTranscripts.slice(-MAX_VISIBLE_BUBBLES);
        }
      }
      
      if (isFinal) {
        setCollectedText(prevText => {
          const newText = prevText + (prevText ? ' ' : '') + text;
          if (autoCopy) {
            copyToClipboard(newText);
          }
          return newText;
        });
      }
      return newTranscripts;
    });
  }, [autoCopy, clearTranscripts, copyToClipboard, stopListening]);

  // Function to check if local service is available
  const checkLocalService = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:11434/api/health');
      return response.ok;
    } catch (error) {
      return false;
    }
  }, []);

  // Periodically check for local service when it's selected
  useEffect(() => {
    let interval;
    if (serviceType === SpeechServiceType.LOCAL_SPEECH && !isCheckingLocalService) {
      interval = setInterval(async () => {
        const isAvailable = await checkLocalService();
        if (isAvailable) {
          setShowSetupInstructions(false);
          clearInterval(interval);
          await SpeechServiceFactory.initService(serviceType);
        }
      }, 2000); // Check every 2 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [serviceType, checkLocalService, isCheckingLocalService]);

  // Load service info
  useEffect(() => {
    const info = SpeechServiceFactory.getServiceInfo();
    setServiceInfo(info || []);
    if (info && info.length > 0) {
      const webSpeechService = info.find(s => s.id === SpeechServiceType.WEB_SPEECH);
      if (webSpeechService) {
        setSelectedService(webSpeechService);
      }
    }
  }, []);

  // Initialize speech service
  useEffect(() => {
    const initService = async () => {
      try {
        await SpeechServiceFactory.initService(serviceType);
      } catch (err) {
        console.error('Error initializing service:', err);
        setError(err.message);
      }
    };

    initService();
  }, [serviceType]);

  const handleServiceChange = async (event) => {
    const newType = event.target.value;
    setIsListening(false);
    setError(null);
    
    const service = serviceInfo.find(s => s.id === newType);
    setSelectedService(service);
    
    if (service.setupRequired) {
      const isAvailable = await checkLocalService();
      if (!isAvailable) {
        setShowSetupInstructions(true);
        setServiceType(SpeechServiceType.WEB_SPEECH); // Keep using web speech until setup is complete
        setIsCheckingLocalService(true);
      } else {
        setShowSetupInstructions(false);
        setServiceType(newType);
        await SpeechServiceFactory.initService(newType);
      }
    } else {
      setShowSetupInstructions(false);
      setServiceType(newType);
      await SpeechServiceFactory.initService(newType);
    }
  };

  const handleSetupComplete = async () => {
    try {
      setShowSetupInstructions(false);
      setServiceType(selectedService.id);
      await SpeechServiceFactory.initService(selectedService.id);
    } catch (error) {
      setError('Failed to connect to local service. Please make sure setup is complete.');
      setServiceType(SpeechServiceType.WEB_SPEECH);
    }
  };

  const toggleListening = useCallback(async () => {
    try {
      if (!isListening) {
        const service = SpeechServiceFactory.getCurrentService();
        if (!service) {
          throw new Error('Speech service not initialized');
        }
        await service.startRecording(handleTranscription);
        setIsListening(true);
      } else {
        stopListening();
      }
    } catch (err) {
      console.error('Error toggling listening:', err);
      setError(err.message || 'Failed to start recording, please try again');
      setIsListening(false);
    }
  }, [isListening, handleTranscription, stopListening]);

  // Space bar shortcut
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space' && event.target === document.body) {
        event.preventDefault();
        toggleListening();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleListening]);

  const handleAutoCopyChange = useCallback((e) => {
    setAutoCopy(e.target.checked);
  }, []);

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
    <div className={styles.layout.background}>
      {/* Status Bar */}
      <div className={styles.statusBar.container}>
        <div className="flex items-center gap-2">
          <div className={isListening ? styles.statusBar.indicator.active : styles.statusBar.indicator.inactive} />
          <span className={styles.statusBar.text}>
            {isListening ? 'Listening...' : 'Microphone off'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className={styles.statusBar.toggleSwitch.container}>
            <div className="mr-2">{isDarkMode ? '🌙' : '☀️'}</div>
            <div 
              className={styles.statusBar.toggleSwitch.activeTrack}
              onClick={toggleDarkMode}
            >
              <div
                className={styles.statusBar.toggleSwitch.activeSlider}
              />
            </div>
          </label>
          <div className="relative group">
            <button
              className={`${styles.info.button} ${styles.info.buttonColor} flex items-center gap-1`}
              aria-label="Help"
              onClick={() => setShowInfo(!showInfo)}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-5 h-5"
              >
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
              Help
            </button>
            <div className={`${showInfo ? 'block' : 'hidden group-hover:block'} ${styles.tooltip.infoContainer}`}>
              <ul className="space-y-2">
                <li>• Click the button below to start/stop speech recognition</li>
                <li>• Say "stop listening" to pause, or "clear clear" to reset</li>
                <li>• Enable "Auto-copy" to automatically copy new text</li>
                <li>• Use the clipboard button to manually copy all text</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.error.container + styles.error.background}>
          {error}
        </div>
      )}

      {/* Transcripts */}
      <div 
        ref={transcriptsContainerRef}
        className={styles.transcripts.container}
      >
        {showBubbles && transcripts.map((text, index) => (
          <div 
            key={index} 
            className={`${styles.transcripts.bubble} ${styles.transcripts.bubbleColors}`}
          >
            {text}
          </div>
        ))}
      </div>

      {/* Main Text Area */}
      <div className={styles.textArea.container}>
        <textarea
          ref={textareaRef}
          value={collectedText}
          onChange={(e) => setCollectedText(e.target.value)}
          className={`${styles.textArea.input} ${styles.textArea.inputColors}`}
          rows={4}
          placeholder="Transcribed text will appear here..."
        />
        <div className="absolute right-2 bottom-2 group">
          <button
            onClick={() => copyToClipboard(collectedText)}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="Copy to clipboard"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-5 h-5"
            >
              <path fillRule="evenodd" d="M17.663 3.118c.225.015.45.032.673.05C19.876 3.298 21 4.604 21 6.109v9.642a3 3 0 01-3 3V16.5c0-5.922-4.576-10.775-10.384-11.217.324-1.132 1.3-2.01 2.548-2.114.224-.019.448-.036.673-.051A3 3 0 0113.5 1.5H15a3 3 0 012.663 1.618zM12 4.5A1.5 1.5 0 0113.5 3H15a1.5 1.5 0 011.5 1.5H12z" clipRule="evenodd" />
              <path d="M3 8.625c0-1.036.84-1.875 1.875-1.875h.375A3.75 3.75 0 019 10.5v1.875c0 1.036.84 1.875 1.875 1.875h1.875A3.75 3.75 0 0116.5 18v2.625c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625v-12z" />
            </svg>
          </button>
          <div className={`absolute bottom-full right-0 mb-2 ${
            isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
          } px-2 py-1 rounded shadow-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity`}>
            Copy all text to clipboard
          </div>
        </div>
      </div>
      
      {/* Settings */}
      <div className={styles.controls.container}>
        <div className="flex items-center gap-4">
          <label className={`${styles.controls.checkboxLabel} group relative ${styles.controls.checkboxText}`}>
            <select
              className={`form-select rounded-md px-3 py-2 appearance-none cursor-pointer transition-colors ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-200 border-gray-700 hover:border-gray-600' 
                  : 'bg-white text-gray-800 border-gray-300 hover:border-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              value={serviceType}
              onChange={handleServiceChange}
            >
              {serviceInfo.map(service => (
                <option 
                  key={service.id} 
                  value={service.id}
                  className={isDarkMode ? 'bg-gray-800' : 'bg-white'}
                >
                  {service.name}
                </option>
              ))}
            </select>
            <div className={`${styles.tooltip.container} w-64 ${
              isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
            }`}>
              {serviceInfo.find(s => s.id === serviceType)?.description}
            </div>
          </label>
          <label className={`${styles.controls.checkboxLabel} group relative ${styles.controls.checkboxText}`}>
            <input
              type="checkbox"
              id="autoCopy"
              checked={autoCopy}
              onChange={handleAutoCopyChange}
              className={styles.controls.checkbox}
            />
            <span>Auto-copy</span>
            <div className={styles.tooltip.container}>
              Automatically copy text to clipboard when new text is transcribed
            </div>
          </label>
          <label className={`${styles.controls.checkboxLabel} group relative ${styles.controls.checkboxText}`}>
            <input
              type="checkbox"
              checked={showBubbles}
              onChange={(e) => setShowBubbles(e.target.checked)}
              className={styles.controls.checkbox}
            />
            <span>Show bubbles</span>
            <div className={styles.tooltip.container}>
              Show real-time transcription bubbles above the main text area
            </div>
          </label>
        </div>
        <div className="relative group">
          <button
            onClick={clearTranscripts}
            className={styles.buttons.primary}
          >
            Clear All
          </button>
          <div className={styles.tooltip.container}>
            Clear all transcribed text and speech bubbles
          </div>
        </div>
      </div>

      <Modal
        isOpen={showSetupInstructions && selectedService}
        onClose={() => {
          setShowSetupInstructions(false);
          setIsCheckingLocalService(false);
          setServiceType(SpeechServiceType.WEB_SPEECH);
        }}
        title="Local Processing Setup Required"
      >
        <div className="space-y-6">
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            To use local processing (HIPAA-compliant), please follow these steps:
          </p>
          <pre className={`p-4 rounded-lg font-mono text-sm overflow-x-auto ${
            isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'
          }`}>
            {selectedService?.setupInstructions}
          </pre>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {
                setShowSetupInstructions(false);
                setIsCheckingLocalService(false);
                setServiceType(SpeechServiceType.WEB_SPEECH);
              }}
              className={`px-4 py-2 rounded transition-colors ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSetupComplete}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              I've completed setup - Connect
            </button>
          </div>
          {isCheckingLocalService && (
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Checking for local service... We'll automatically connect when it's available.
            </p>
          )}
        </div>
      </Modal>

      {/* Main Control Button */}
      <button
        onClick={toggleListening}
        style={{
          ...styles.mainButton,
          backgroundColor: isListening ? '#ff4444' : '#2196F3',
          color: 'white',
          padding: '12px 24px',
          fontSize: '16px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.3s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          ':hover': {
            backgroundColor: isListening ? '#ff6666' : '#1976D2'
          }
        }}
      >
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>
    </div>
  );
};

export default SpeechToText;
