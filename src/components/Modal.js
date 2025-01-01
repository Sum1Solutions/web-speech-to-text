import React from 'react';
import { useTheme } from '../theme/ThemeContext';

const Modal = ({ isOpen, onClose, title, children }) => {
  const { isDarkMode } = useTheme();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden ${
        isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
      }`}>
        <div className={`p-4 flex justify-between items-center border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className={`hover:bg-opacity-10 p-2 rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-gray-300' : 'hover:bg-gray-500'
            }`}
          >
            ✕
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
