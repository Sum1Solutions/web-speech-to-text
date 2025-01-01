import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SpeechToText from '../SpeechToText';
import { ThemeProvider } from '../../theme/ThemeContext';
import { SpeechServiceType } from '../../services/SpeechServiceFactory';

// Mock fetch for local service checks
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true
  })
);

// Mock clipboard API
const mockClipboard = {
  writeText: jest.fn().mockImplementation(() => Promise.resolve())
};
Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true
});

// Create mock service object
const mockService = {
  startRecording: jest.fn(),
  stopRecording: jest.fn(),
  onResult: jest.fn(),
  onError: jest.fn(),
  cleanup: jest.fn()
};

const createMockService = () => ({
  ...mockService,
  onResult: jest.fn((callback) => {
    // Store callback for later use
    mockService.resultCallback = callback;
  })
});

// Mock the speech service factory
jest.mock('../../services/SpeechServiceFactory', () => {
  const mockServiceInfo = [
    {
      id: 'WEB_SPEECH',
      name: 'Web Speech API',
      description: 'Browser\'s built-in speech recognition (Not HIPAA Compliant)',
      hipaaCompliant: false,
      setupRequired: false
    },
    {
      id: 'LOCAL_SPEECH',
      name: 'Local Processing',
      description: 'Local machine processing (HIPAA Compliant)',
      hipaaCompliant: true,
      setupRequired: true,
      setupInstructions: 'Setup instructions here'
    }
  ];

  return {
    SpeechServiceType: {
      WEB_SPEECH: 'WEB_SPEECH',
      LOCAL_SPEECH: 'LOCAL_SPEECH'
    },
    __esModule: true,
    default: {
      initService: jest.fn().mockImplementation(async (type) => {
        const mockService = createMockService();
        return mockService;
      }),
      getCurrentService: jest.fn().mockImplementation(() => {
        const mockService = createMockService();
        return mockService;
      }),
      getServiceType: jest.fn().mockReturnValue('WEB_SPEECH'),
      getServiceInfo: jest.fn().mockReturnValue(mockServiceInfo)
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
  let mockFactory;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    global.fetch.mockClear();
    mockClipboard.writeText.mockClear();
  });

  test('initializes with Web Speech API by default', async () => {
    renderWithTheme(<SpeechToText />);
    
    await waitFor(() => {
      expect(mockFactory.initService).toHaveBeenCalledWith('WEB_SPEECH');
    });
  });

  test('shows setup modal when switching to local service', async () => {
    global.fetch.mockImplementationOnce(() => Promise.reject(new Error()));
    renderWithTheme(<SpeechToText />);
    
    // Start listening button should be available
    await waitFor(() => {
      expect(screen.getByText('Start Listening')).toBeInTheDocument();
    });

    // Click start listening to initialize service
    const startButton = screen.getByText('Start Listening');
    await user.click(startButton);

    // Service should be initialized
    await waitFor(() => {
      expect(mockFactory.initService).toHaveBeenCalledWith('WEB_SPEECH');
    });

    // Change service type and trigger re-render
    mockFactory.getServiceType.mockReturnValue('LOCAL_SPEECH');
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'LOCAL_SPEECH');
    
    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText('Local Processing Setup Required')).toBeInTheDocument();
      expect(screen.getByText('Setup instructions here')).toBeInTheDocument();
    });
  });

  test('automatically connects when local service becomes available', async () => {
    global.fetch.mockImplementationOnce(() => Promise.reject(new Error()));
    renderWithTheme(<SpeechToText />);
    
    // Start listening button should be available
    await waitFor(() => {
      expect(screen.getByText('Start Listening')).toBeInTheDocument();
    });

    // Click start listening to initialize service
    const startButton = screen.getByText('Start Listening');
    await user.click(startButton);

    // Service should be initialized
    await waitFor(() => {
      expect(mockFactory.initService).toHaveBeenCalledWith('WEB_SPEECH');
    });

    // Change service type and trigger re-render
    mockFactory.getServiceType.mockReturnValue('LOCAL_SPEECH');
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'LOCAL_SPEECH');

    // Service becomes available
    global.fetch.mockImplementationOnce(() => Promise.resolve({ ok: true }));
    
    await waitFor(() => {
      expect(mockFactory.initService).toHaveBeenCalledWith('LOCAL_SPEECH');
    });
  });

  test('handles voice command "clear clear"', async () => {
    renderWithTheme(<SpeechToText />);
    
    // Start listening button should be available
    await waitFor(() => {
      expect(screen.getByText('Start Listening')).toBeInTheDocument();
    });

    // Click start listening to initialize service
    const startButton = screen.getByText('Start Listening');
    await user.click(startButton);

    // Wait for service to be initialized and store callback
    await waitFor(() => {
      expect(mockFactory.initService).toHaveBeenCalled();
    });

    // Add some text first
    act(() => {
      mockService.resultCallback({
        text: 'Initial text',
        isFinal: true
      });
    });

    // Simulate "clear clear" command
    act(() => {
      mockService.resultCallback({
        text: 'Clear, clear',
        isFinal: true
      });
    });

    // Verify textarea is cleared
    const textarea = screen.getByRole('textbox');
    expect(textarea.value).toBe('');
  });

  test('handles voice command "stop listening"', async () => {
    renderWithTheme(<SpeechToText />);
    
    // Start listening button should be available
    await waitFor(() => {
      expect(screen.getByText('Start Listening')).toBeInTheDocument();
    });

    // Click start listening to initialize service
    const startButton = screen.getByText('Start Listening');
    await user.click(startButton);

    // Wait for service to be initialized and store callback
    await waitFor(() => {
      expect(mockFactory.initService).toHaveBeenCalled();
    });

    // Simulate "stop listening" command
    act(() => {
      mockService.resultCallback({
        text: 'Stop listening',
        isFinal: true
      });
    });

    expect(mockService.stopRecording).toHaveBeenCalled();
  });

  test('copies text to clipboard when clicking copy button', async () => {
    renderWithTheme(<SpeechToText />);

    // Get textarea and set value directly
    const textarea = screen.getByRole('textbox');
    await act(async () => {
      // Use fireEvent to trigger change event
      fireEvent.change(textarea, { target: { value: 'Test text' } });
    });

    // Click copy button
    const copyButton = screen.getByTitle('Copy to clipboard');
    await user.click(copyButton);

    // Verify clipboard was called
    expect(mockClipboard.writeText).toHaveBeenCalledWith('Test text');
  });

  test('shows help information when clicking help button', async () => {
    renderWithTheme(<SpeechToText />);
    
    await waitFor(() => {
      const helpButton = screen.getByRole('button', { name: /help/i });
      expect(helpButton).toBeInTheDocument();
    });

    const helpButton = screen.getByRole('button', { name: /help/i });
    await user.click(helpButton);

    expect(screen.getByText(/say "stop listening" to pause/i)).toBeInTheDocument();
  });
});
