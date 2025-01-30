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
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
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

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const lastResult = event.results[event.results.length - 1];
        const transcript = lastResult[0].transcript;
        onResult(transcript, lastResult.isFinal);
      };

      recognition.onerror = (event: Event) => {
        const errorEvent = event as Event & { error: string; message: string };
        onError(errorEvent);
      };

      recognition.onend = () => {
        setIsListening(false);
        onEnd();
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (error) {
      console.error('Speech recognition error:', error);
      const errorEvent = new Event('error') as Event & { error: string; message: string };
      errorEvent.error = 'start_error';
      errorEvent.message = error instanceof Error ? error.message : 'Failed to start speech recognition';
      onError(errorEvent);
    }
  }, [onResult, onError, onEnd]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
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
