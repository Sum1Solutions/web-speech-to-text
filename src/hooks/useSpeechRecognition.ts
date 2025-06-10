import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechRecognitionProps {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: Event & { error: string; message: string }) => void;
  onEnd: () => void;
}

interface SpeechRecognitionResult {
  [index: number]: {
    transcript: string;
  };
  isFinal: boolean;
}

interface SpeechRecognitionResults extends Array<SpeechRecognitionResult> {
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResults;
  resultIndex: number;
}

export const useSpeechRecognition = ({
  onResult,
  onError,
  onEnd
}: UseSpeechRecognitionProps) => {
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const manuallyStoppedRef = useRef(false);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      manuallyStoppedRef.current = true;
      recognitionRef.current.stop();
      // setIsListening(false) will be handled by the onend event to correctly reflect the recognition state
    }
  }, []);

  const startListening = useCallback(() => {
    try {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        throw new Error('Speech recognition is not supported in this browser.');
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-us'; // Explicitly set language to US English (lowercase)

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        // Get all results from this event
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          onResultRef.current(transcript, result.isFinal);
        }
      };

      recognition.onerror = (event: Event) => {
        const errorEvent = event as Event & { error: string; message: string };
        onErrorRef.current(errorEvent);
      };

      recognition.onend = () => {
        setIsListening(false); // Always update listening state when recognition actually ends
        if (!manuallyStoppedRef.current) {
          // If recognition ended for reasons other than an explicit stop (e.g., browser timeout, end of long speech segment)
          console.log('Speech recognition ended unexpectedly, attempting to restart for continuous listening...');
          startListening(); // Attempt to restart to maintain continuous listening
        } else {
          // This was an explicit stop by the user
          onEndRef.current(); // Call the original onEnd callback provided by the parent component
          manuallyStoppedRef.current = false; // Reset flag for the next time recognition starts
        }
      };

      manuallyStoppedRef.current = false; // Reset manual stop flag each time listening starts
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (error) {
      console.error('Speech recognition error:', error);
      const errorEvent = new Event('error') as Event & { error: string; message: string };
      errorEvent.error = 'start_error';
      errorEvent.message = error instanceof Error ? error.message : 'Failed to start speech recognition';
      onErrorRef.current(errorEvent);
    }
  }, []); // Dependencies are now empty as props are accessed via refs

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        // Ensure that if the component unmounts or hook re-runs, stopping recognition is treated as a manual stop
        // to prevent auto-restart attempts during cleanup.
        manuallyStoppedRef.current = true; 
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    isListening,
    startListening,
    stopListening
  };
};
