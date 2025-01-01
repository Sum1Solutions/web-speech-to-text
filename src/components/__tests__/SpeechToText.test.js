import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SpeechToText from '../SpeechToText';

// Mock implementation of the Web Speech API
const setupSpeechRecognition = () => {
  const mockRecognition = {
    start: jest.fn(),
    stop: jest.fn(),
    continuous: false,
    interimResults: false,
    lang: '',
    onresult: null,
    onerror: null,
    onend: null
  };

  const Recognition = function() {
    return mockRecognition;
  };

  window.SpeechRecognition = Recognition;
  window.webkitSpeechRecognition = Recognition;

  return mockRecognition;
};

describe('SpeechToText Component', () => {
  let mockRecognition;
  let user;
  let consoleErrorSpy;

  beforeEach(() => {
    user = userEvent.setup();
    mockRecognition = setupSpeechRecognition();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock the clipboard API
    const mockClipboard = {
      writeText: jest.fn(() => Promise.resolve())
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
      configurable: true
    });

    // Reset the mock between tests
    navigator.clipboard.writeText.mockClear();
  });

  afterEach(() => {
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  test('renders initial state correctly', () => {
    render(<SpeechToText />);
    
    expect(screen.getByText('Microphone off')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start listening/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /auto-copy/i })).toBeChecked();
  });

  test('handles browser without speech recognition', () => {
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
    
    render(<SpeechToText />);
    
    expect(screen.getByText(/speech recognition is not supported/i)).toBeInTheDocument();
  });

  test('starts and stops listening when button is clicked', async () => {
    render(<SpeechToText />);
    
    // Start listening
    await user.click(screen.getByRole('button', { name: /start listening/i }));
    expect(mockRecognition.start).toHaveBeenCalled();
    expect(screen.getByText('Listening...')).toBeInTheDocument();

    // Stop listening
    await user.click(screen.getByRole('button', { name: /stop listening/i }));
    expect(mockRecognition.stop).toHaveBeenCalled();
    expect(screen.getByText('Microphone off')).toBeInTheDocument();
  });

  test('handles speech recognition results', async () => {
    render(<SpeechToText />);
    
    // Start listening
    await user.click(screen.getByRole('button', { name: /start listening/i }));

    // Simulate speech result
    act(() => {
      mockRecognition.onresult({
        results: [[{ transcript: 'Hello world', isFinal: true }]],
        resultIndex: 0
      });
    });

    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  test('handles microphone permission denied', async () => {
    render(<SpeechToText />);
    
    await user.click(screen.getByRole('button', { name: /start listening/i }));

    // Simulate permission denied error
    act(() => {
      mockRecognition.onerror({ error: 'not-allowed' });
    });

    await waitFor(() => {
      expect(screen.getByText(/microphone access denied/i)).toBeInTheDocument();
    });
  });

  test('clears transcripts when clear button is clicked', async () => {
    render(<SpeechToText />);
    
    // Add some text
    act(() => {
      mockRecognition.onresult({
        results: [[{ transcript: 'Test transcript', isFinal: true }]],
        resultIndex: 0
      });
    });

    // Clear transcripts
    await user.click(screen.getByRole('button', { name: /clear/i }));
    expect(screen.queryByText('Test transcript')).not.toBeInTheDocument();
  });

  test('auto-copies text when enabled', async () => {
    render(<SpeechToText />);
    
    // Start listening
    await user.click(screen.getByRole('button', { name: /start listening/i }));

    // Simulate speech result with final flag
    await act(async () => {
      mockRecognition.onresult({
        resultIndex: 0,
        results: [[{ transcript: 'Copy this text', isFinal: true }]]
      });
    });

    // Wait for the clipboard API to be called
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Copy this text');
    }, { timeout: 2000 });
  });

  test('handles voice commands', async () => {
    render(<SpeechToText />);
    
    // Start listening
    await user.click(screen.getByRole('button', { name: /start listening/i }));

    // Test "clear clear" command
    await act(async () => {
      mockRecognition.onresult({
        resultIndex: 0,
        results: [[{ transcript: 'clear clear', isFinal: true }]]
      });
    });

    // Verify transcripts are cleared
    await waitFor(() => {
      const transcriptElements = screen.queryAllByRole('generic').filter(el => 
        el.className.includes('bg-white') && el.textContent === 'clear clear'
      );
      expect(transcriptElements.length).toBe(0);
    }, { timeout: 2000 });

    // Add some text to verify clearing works
    await act(async () => {
      mockRecognition.onresult({
        resultIndex: 0,
        results: [[{ transcript: 'test text', isFinal: true }]]
      });
    });

    // Verify text appears
    await waitFor(() => {
      expect(screen.getByText('test text')).toBeInTheDocument();
    });

    // Test "stop listening" command
    await act(async () => {
      mockRecognition.onresult({
        resultIndex: 0,
        results: [[{ transcript: 'stop listening', isFinal: true }]]
      });
    });

    // Wait for the command to be processed and verify listening has stopped
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start listening/i })).toBeInTheDocument();
    });
  });

  test('handles recognition end and restarts if still listening', async () => {
    render(<SpeechToText />);
    
    await user.click(screen.getByRole('button', { name: /start listening/i }));
    
    act(() => {
      mockRecognition.onend();
    });

    expect(mockRecognition.start).toHaveBeenCalledTimes(2); // Once for initial start, once for restart
  });
});
