import React from 'react';
import SpeechToText from './components/SpeechToText';
import { ThemeProvider } from './theme/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <SpeechToText />
      </div>
    </ThemeProvider>
  );
}

export default App;
