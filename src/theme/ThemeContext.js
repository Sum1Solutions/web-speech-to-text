import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const theme = {
    isDarkMode,
    toggleDarkMode: () => setIsDarkMode(!isDarkMode),
    styles: {
      layout: {
        container: "flex flex-col h-screen max-h-screen p-4",
        get background() {
          return this.container + (isDarkMode ? " bg-gray-800" : " bg-gray-100");
        }
      },
      statusBar: {
        container: "flex items-center justify-between mb-4 text-sm",
        indicator: {
          base: "h-3 w-3 rounded-full",
          get active() {
            return this.base + " bg-red-500 animate-pulse";
          },
          get inactive() {
            return this.base + " bg-gray-400";
          }
        },
        text: isDarkMode ? "text-gray-300" : "text-gray-600",
        toggleSwitch: {
          container: "flex items-center cursor-pointer",
          track: "w-11 h-6 bg-gray-600 rounded-full p-1 transition-colors duration-300",
          get activeTrack() {
            return this.track + (isDarkMode ? " bg-blue-600" : " bg-gray-400");
          },
          slider: "bg-white w-4 h-4 rounded-full shadow-md transform duration-300",
          get activeSlider() {
            return this.slider + (isDarkMode ? " translate-x-5" : "");
          }
        }
      },
      error: {
        container: "mb-4 p-3 rounded-lg",
        get background() {
          return isDarkMode ? " bg-red-900 text-red-200" : " bg-red-100 text-red-700";
        }
      },
      transcripts: {
        container: "flex-1 overflow-y-auto mb-4 space-y-2 min-h-0",
        bubble: "p-3 rounded-lg shadow break-words",
        get bubbleColors() {
          return isDarkMode ? " bg-gray-700 text-gray-200" : " bg-white text-gray-800";
        }
      },
      textArea: {
        container: "relative mb-4 flex-shrink-0",
        input: "w-full p-3 rounded-lg shadow resize-none transition-colors duration-200",
        get inputColors() {
          return isDarkMode ? " bg-gray-700 text-gray-200" : " bg-white text-gray-800";
        }
      },
      buttons: {
        base: "px-4 py-2 text-sm rounded-lg transition-colors",
        get primary() {
          return this.base + (isDarkMode 
            ? " bg-gray-600 text-gray-300 hover:bg-gray-500" 
            : " bg-gray-200 text-gray-700 hover:bg-gray-300");
        }
      },
      controls: {
        container: "flex flex-col sm:flex-row sm:items-center gap-4 mb-4 flex-shrink-0",
        checkboxLabel: "flex items-center space-x-2",
        get checkboxText() {
          return isDarkMode ? " text-gray-200" : " text-gray-800";
        },
        checkbox: "form-checkbox h-5 w-5"
      },
      tooltip: {
        container: "hidden group-hover:block absolute bottom-full mb-2 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-10",
        infoContainer: "hidden group-hover:block absolute right-0 top-full mt-2 p-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-10 w-64"
      },
      info: {
        button: "p-2 transition-colors",
        get buttonColor() {
          return isDarkMode 
            ? "text-gray-300 hover:text-gray-100" 
            : "text-gray-600 hover:text-gray-800";
        }
      }
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
