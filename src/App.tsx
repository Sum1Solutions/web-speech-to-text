import React from 'react';
import SpeechToText from './components/SpeechToText';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <div className="App">
      <ErrorBoundary>
        <SpeechToText />
      </ErrorBoundary>
    </div>
  );
}

export default App;
