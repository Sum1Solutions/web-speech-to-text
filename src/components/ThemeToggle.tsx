import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 dark:text-gray-300">
        {isDark ? 'Dark' : 'Light'} Mode
      </span>
      <button
        onClick={toggleTheme}
        className={`relative inline-flex items-center h-8 rounded-full w-16 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isDark 
            ? 'bg-gray-700 hover:bg-gray-600' 
            : 'bg-blue-100 hover:bg-blue-200'
        }`}
        role="switch"
        aria-checked={isDark}
        aria-label="Toggle dark mode"
      >
        <span className="sr-only">Toggle dark mode</span>
        <div
          className={`absolute left-1 transform transition-transform duration-200 ${
            isDark ? 'translate-x-8' : 'translate-x-0'
          }`}
        >
          <div className="flex items-center justify-center w-6 h-6 rounded-full shadow-md bg-white dark:bg-gray-800">
            <span className="text-sm" role="img" aria-hidden="true">
              {isDark ? '🌙' : '☀️'}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
};

export default ThemeToggle;
