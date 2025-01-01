import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SpeechToText from '../SpeechToText';
import { ThemeProvider } from '../../theme/ThemeContext';
import { SpeechServiceType } from '../../services/SpeechServiceFactory';

// Create mock service object
const createMockService = () => ({
  startListening: jest.fn().mockResolvedValue(undefined),
  stopListening: jest.fn(),
  isListening: jest.fn().mockReturnValue(false),
  onResult: jest.fn(),
  onError: jest.fn(),
  onEnd: jest.fn()
});

// Mock the speech service factory
jest.mock('../../services/SpeechServiceFactory', () => {
  const mockServiceInfo = [
    {
      id: 'WEB_SPEECH',
      name: 'Web Speech API',
      description: 'Browser\'s built-in speech recognition (Not HIPAA Compliant)',
      hipaaCompliant: false
    },
    {
      id: 'LOCAL_OLLAMA',
      name: 'Local Ollama',
      description: 'Local machine processing using Ollama (HIPAA Compliant)',
      hipaaCompliant: true
    }
  ];

  return {
    SpeechServiceType: {
      WEB_SPEECH: 'WEB_SPEECH',
      LOCAL_OLLAMA: 'LOCAL_OLLAMA'
    },
    __esModule: true,
    default: {
      initService: jest.fn().mockImplementation(async () => {
        const mockService = createMockService();
        return mockService;
      }),
      getCurrentService: jest.fn().mockImplementation(() => {
        const mockService = createMockService();
        return mockService;
      }),
      getServiceType: jest.fn().mockReturnValue('WEB_SPEECH'),
      getServiceInfo: jest.fn().mockReturnValue(mockServiceInfo),
      checkOllamaAvailable: jest.fn().mockReturnValue(true)
    }
  };
});

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider>{component}</ThemeProvider>
  );
};

describe('SpeechToText Component', () => {
  let user;
  let mockService;
  let mockFactory;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // Reset mock service for each test
    mockService = createMockService();
    mockFactory = jest.requireMock('../../services/SpeechServiceFactory').default;
    mockFactory.getCurrentService.mockReturnValue(mockService);
    mockFactory.initService.mockResolvedValue(mockService);
  });

  test('initializes with Web Speech API by default', async () => {
    renderWithTheme(<SpeechToText />);
    
    await waitFor(() => {
      expect(mockFactory.initService).toHaveBeenCalledWith(SpeechServiceType.WEB_SPEECH);
    });
  });

  test('switches between services', async () => {
    renderWithTheme(<SpeechToText />);
    
    // Wait for initial service to be initialized
    await waitFor(() => {
      const select = screen.getByRole('combobox');
      expect(select).not.toBeDisabled();
    });

    // Mock successful Ollama check for this test
    mockFactory.checkOllamaAvailable = jest.fn().mockReturnValue(true);
  
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'LOCAL_OLLAMA');
  
    expect(mockFactory.initService).toHaveBeenCalledWith('LOCAL_OLLAMA');
  });

  test('shows Ollama installation message when switching to Ollama without it installed', async () => {
    renderWithTheme(<SpeechToText />);
    
    // Wait for initial service to be initialized
    await waitFor(() => {
      const select = screen.getByRole('combobox');
      expect(select).not.toBeDisabled();
    });

    // Mock Ollama not available
    mockFactory.checkOllamaAvailable = jest.fn().mockReturnValue(false);
  
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'LOCAL_OLLAMA');
  
    // Should show installation message
    await waitFor(() => {
      expect(screen.getByText(/Please install Ollama first/)).toBeInTheDocument();
    });
  });

  test('starts and stops listening', async () => {
    renderWithTheme(<SpeechToText />);
    
    // Wait for initial service to be initialized
    await waitFor(() => {
      expect(mockFactory.initService).toHaveBeenCalled();
    });

    // Start listening
    await user.click(screen.getByRole('button', { name: /start listening/i }));
    expect(mockService.startListening).toHaveBeenCalled();
    expect(mockService.onResult).toHaveBeenCalled();
    expect(screen.getByText('Listening...')).toBeInTheDocument();

    // Stop listening
    await user.click(screen.getByRole('button', { name: /stop listening/i }));
    expect(mockService.stopListening).toHaveBeenCalled();
    expect(screen.getByText('Microphone off')).toBeInTheDocument();
  });

  test('handles transcription results', async () => {
    renderWithTheme(<SpeechToText />);
    
    // Wait for service initialization
    await waitFor(() => {
      expect(mockFactory.initService).toHaveBeenCalled();
    });

    const startButton = screen.getByRole('button', { name: /start listening/i });
    await user.click(startButton);

    // Get the callback that was registered with onResult
    expect(mockService.onResult).toHaveBeenCalled();
    const onResultCallback = mockService.onResult.mock.calls[0][0];

    // Simulate a transcription result by calling the callback directly
    act(() => {
      onResultCallback({ text: 'Hello, world!', isFinal: true });
    });

    // Wait for state updates
    await waitFor(() => {
      const textarea = screen.getByRole('textbox');
      expect(textarea.value).toBe('Hello, world!');
    });

    // Check that text appears in the transcript bubble
    const bubble = screen.getByText('Hello, world!', { selector: '.rounded-lg.shadow.break-words' });
    expect(bubble).toBeInTheDocument();
  });

  test('handles voice commands', async () => {
    renderWithTheme(<SpeechToText />);
    
    // Wait for initial service to be initialized
    await waitFor(() => {
      expect(mockFactory.initService).toHaveBeenCalled();
    });

    // Start listening
    await user.click(screen.getByRole('button', { name: /start listening/i }));
    const [[callback]] = mockService.onResult.mock.calls;

    // Test "stop listening" command
    act(() => {
      callback({
        text: 'stop listening',
        isFinal: true
      });
    });
    expect(mockService.stopListening).toHaveBeenCalled();

    // Start again and test "clear clear" command
    await user.click(screen.getByRole('button', { name: /start listening/i }));
    const [[newCallback]] = mockService.onResult.mock.calls;
    
    // Add some text first
    act(() => {
      newCallback({
        text: 'This is some text',
        isFinal: true
      });
    });

    // Then clear it
    act(() => {
      newCallback({
        text: 'clear clear',
        isFinal: true
      });
    });

    expect(screen.queryByText('This is some text')).not.toBeInTheDocument();
  });

  test('handles service initialization error', async () => {
    const errorMessage = 'Failed to initialize service';
    mockFactory.initService.mockRejectedValueOnce(new Error(errorMessage));
    
    renderWithTheme(<SpeechToText />);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('handles start listening error', async () => {
    renderWithTheme(<SpeechToText />);
    
    // Wait for initial service to be initialized
    await waitFor(() => {
      expect(mockFactory.initService).toHaveBeenCalled();
    });

    mockService.startListening.mockRejectedValueOnce(new Error('Failed to start listening'));
    await user.click(screen.getByRole('button', { name: /start listening/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to start recording. Please try again.')).toBeInTheDocument();
    });
  });
});
