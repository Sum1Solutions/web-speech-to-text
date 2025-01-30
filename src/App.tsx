import React from 'react';
import SpeechToText from './components/SpeechToText';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
        <ErrorBoundary>
          <SpeechToText />
        </ErrorBoundary>
      </div>
    </ThemeProvider>
  );
}

export default App;
