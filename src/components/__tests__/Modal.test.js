import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Modal from '../Modal';
import { ThemeProvider } from '../../theme/ThemeContext';

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider>{component}</ThemeProvider>
  );
};

describe('Modal Component', () => {
  const mockOnClose = jest.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    title: 'Test Modal',
    children: <div>Modal Content</div>
  };

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  test('renders nothing when closed', () => {
    renderWithTheme(<Modal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  test('renders modal when open', () => {
    renderWithTheme(<Modal {...defaultProps} />);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    renderWithTheme(<Modal {...defaultProps} />);
    
    const closeButton = screen.getByText('✕');
    await user.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('renders with dark mode styles', () => {
    renderWithTheme(<Modal {...defaultProps} />);
    const modalContent = screen.getByText('Modal Content').parentElement.parentElement;
    expect(modalContent).toHaveClass('bg-gray-900', { exact: false });
  });
});
