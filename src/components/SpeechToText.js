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
    // Always use localhost in the browser
    const ollamaUrl = 'http://localhost:11434';
    try {
      const response = await fetch(`${ollamaUrl}/api/tags`);
      if (!response.ok) {
        setError('Cannot connect to Ollama service. Please make sure you have run "./start.sh --full" and the service is running.');
        return false;
      }
      const data = await response.json();
      console.log('Ollama service check successful:', data);
      return true;
    } catch (error) {
      console.error('Error checking local service:', error);
      setError('Failed to connect to local service. Please check the console for more information.');
      return false;
    }
  }, []);

  // Periodically check for local service when it's selected
  useEffect(() => {
    let interval;
    let isComponentMounted = true;

    const checkService = async () => {
      if (!isComponentMounted) return;
      const isAvailable = await checkLocalService();
      if (isAvailable && isComponentMounted) {
        setShowSetupInstructions(false);
        clearInterval(interval);
      }
    };

    if (serviceType === SpeechServiceType.LOCAL_SPEECH && !isCheckingLocalService) {
      checkService();
      interval = setInterval(checkService, 5000);
    }

    return () => {
      isComponentMounted = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [serviceType, isCheckingLocalService, checkLocalService]);

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
    let isComponentMounted = true;
    
    const initService = async () => {
      try {
        setError(null);
        await SpeechServiceFactory.initService(serviceType);
        if (!isComponentMounted) return;
        
        // Reset error state on successful initialization
        setError(null);
        setShowSetupInstructions(false);
      } catch (err) {
        if (!isComponentMounted) return;
        console.error('Error initializing service:', err);
        setError(err.message);
        
        // If local service fails, fallback to web speech
        if (serviceType === SpeechServiceType.LOCAL_OLLAMA) {
          console.log('Falling back to Web Speech...');
          setServiceType(SpeechServiceType.WEB_SPEECH);
          const service = serviceInfo.find(s => s.id === SpeechServiceType.WEB_SPEECH);
          setSelectedService(service);
        }
      }
    };

    initService();
    
    return () => {
      isComponentMounted = false;
      // Clean up service when changing type
      const service = SpeechServiceFactory.getCurrentService();
      if (service) {
        service.disconnect();
      }
    };
  }, [serviceType, serviceInfo]);

  const handleServiceChange = async (event) => {
    const newType = event.target.value;
    setIsListening(false);
    setError(null);
    
    const service = serviceInfo.find(s => s.id === newType);
    setSelectedService(service);
    
    if (service.setupRequired) {
      try {
        const isAvailable = await checkLocalService();
        if (!isAvailable) {
          setShowSetupInstructions(true);
          // Keep current service type until setup is complete
          return;
        }
        setShowSetupInstructions(false);
      } catch (error) {
        console.error('Error checking local service:', error);
        setError('Failed to check local service availability');
        return;
      }
    }
    
    setServiceType(newType);
  };

  const handleSetupComplete = async () => {
    setError(null);
    try {
      const isAvailable = await checkLocalService();
      if (!isAvailable) {
        setError('Local service is not available yet. Please ensure setup is complete.');
        return;
      }
      
      setShowSetupInstructions(false);
      setServiceType(selectedService.id);
    } catch (error) {
      console.error('Error checking local service:', error);
      setError('Failed to connect to local service. Please make sure setup is complete.');
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
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584zM9 7h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
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
            className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
              isDarkMode 
                ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-700 border border-gray-600' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-300'
            }`}
            title="Copy to clipboard"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-5 h-5"
            >
              <path d="M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm0 2v14h10V5H7z"/>
              <path d="M13 7h4v2h-4V7zm0 4h4v2h-4v-2zm0 4h4v2h-4v-2zM9 7h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2z"/>
            </svg>
            <span>Copy</span>
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
              className={`form-select rounded-md px-3 py-2 appearance-none cursor-pointer transition-colors border-2 ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-200 border-gray-600 hover:border-gray-500 focus:border-blue-500' 
                  : 'bg-white text-gray-800 border-gray-300 hover:border-gray-400 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
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
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
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
