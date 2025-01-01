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
  const processedResultsRef = useRef(new Set());
  const textareaRef = useRef(null);
  const transcriptsContainerRef = useRef(null);

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
    setServiceType(newType);
  };

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    setCollectedText("");
    processedResultsRef.current.clear();
    setError(null);
  }, []);

  const handleTranscription = useCallback((data) => {
    setError(null);
    const { text, isFinal } = data;
    
    // Check for voice commands
    if (isFinal) {
      const command = text.trim().toLowerCase();
      if (command === "clear clear") {
        clearTranscripts();
        return;
      }
      if (command === "stop listening") {
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
  }, [autoCopy, clearTranscripts]);

  const stopListening = useCallback(() => {
    setError(null);
    setIsListening(false);
    SpeechServiceFactory.stopRecording();
  }, []);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      await SpeechServiceFactory.startRecording(handleTranscription);
      setIsListening(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please try again.');
      setIsListening(false);
    }
  }, [handleTranscription]);

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
            className={styles.transcripts.bubble + styles.transcripts.bubbleColors}
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
          className={styles.textArea.input + styles.textArea.inputColors}
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
          <label className={styles.controls.checkboxLabel + " group relative" + styles.controls.checkboxText}>
            <select
              value={serviceType}
              onChange={handleServiceChange}
              className="form-select rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              disabled={isListening}
            >
              {SpeechServiceFactory.getServiceInfo().map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
            <div className={styles.tooltip.container + " w-64"}>
              {SpeechServiceFactory.getServiceInfo().find(s => s.id === serviceType)?.description}
            </div>
          </label>
          <label className={styles.controls.checkboxLabel + " group relative" + styles.controls.checkboxText}>
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
          <label className={styles.controls.checkboxLabel + " group relative" + styles.controls.checkboxText}>
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

      {/* Main Control Button */}
      <button
        onClick={isListening ? stopListening : startListening}
        className={styles.buttons.primary + " w-full"}
      >
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>
    </div>
  );
};

export default SpeechToText;
