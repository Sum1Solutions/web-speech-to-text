import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../theme/ThemeContext';
import SpeechServiceFactory, { SpeechServiceType } from '../services/SpeechServiceFactory';

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

  // Initialize service info
  useEffect(() => {
    const info = SpeechServiceFactory.getServiceInfo();
    setServiceInfo(info || []);
    setSelectedService(info.find(s => s.id === SpeechServiceType.WEB_SPEECH));
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
      setShowSetupInstructions(true);
      setServiceType(SpeechServiceType.WEB_SPEECH); // Keep using web speech until setup is complete
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
              className={styles.info.button + " " + styles.info.buttonColor}
              aria-label="Information"
              onClick={() => setShowInfo(!showInfo)}
            >
              ℹ️
            </button>
            <div className={`${showInfo ? 'block' : 'hidden group-hover:block'} ${styles.tooltip.infoContainer}`}>
              <ul className="space-y-2">
                <li>• Click the button below to start/stop speech recognition</li>
                <li>• Say "stop listening" to pause, or "clear clear" to reset</li>
                <li>• Enable "Auto-copy" to automatically copy new text</li>
                <li>• Use the 📋 button to manually copy all text</li>
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
            onClick={() => copyToClipboard()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Copy to clipboard"
          >
            📋
          </button>
          <div className={styles.tooltip.container}>
            Copy all text to clipboard
          </div>
        </div>
      </div>
      
      {/* Settings */}
      <div className={styles.controls.container}>
        <div className="flex items-center gap-4">
          <label className={`${styles.controls.checkboxLabel} group relative ${styles.controls.checkboxText}`}>
            <select
              className="form-select rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              value={serviceType}
              onChange={handleServiceChange}
            >
              {serviceInfo.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
            <div className={styles.tooltip.container + " w-64"}>
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
        {showSetupInstructions && selectedService && (
          <div className="setup-instructions" style={styles.setupInstructions}>
            <h3>Setup Required</h3>
            <pre>{selectedService.setupInstructions}</pre>
            <button 
              onClick={handleSetupComplete}
              style={styles.button}
            >
              I've completed setup - Connect
            </button>
          </div>
        )}
      </div>

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
