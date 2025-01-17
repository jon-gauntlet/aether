import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import Toast from '../Toast';

describe('Toast', () => {
  const defaultProps = {
    message: 'Test message',
    type: 'info',
    duration: 3000,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<Toast {...defaultProps} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-blue-100'); // info style
  });

  it('renders different types with correct styles', () => {
    const types = {
      success: 'bg-green-100',
      error: 'bg-red-100',
      warning: 'bg-yellow-100',
      info: 'bg-blue-100',
    };

    Object.entries(types).forEach(([type, expectedClass]) => {
      const { rerender } = render(<Toast {...defaultProps} type={type} />);
      expect(screen.getByRole('alert')).toHaveClass(expectedClass);
      rerender(<></>);
    });
  });

  it('calls onClose after duration', async () => {
    render(<Toast {...defaultProps} />);
    
    await act(async () => {
      vi.advanceTimersByTime(defaultProps.duration);
    });

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not auto-close if duration is 0', async () => {
    render(<Toast {...defaultProps} duration={0} />);
    
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('handles manual close', () => {
    render(<Toast {...defaultProps} />);
    const closeButton = screen.getByRole('button');
    
    closeButton.click();
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('cleans up timer on unmount', () => {
    const { unmount } = render(<Toast {...defaultProps} />);
    unmount();
    
    vi.advanceTimersByTime(defaultProps.duration);
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('has correct ARIA attributes', () => {
    render(<Toast {...defaultProps} />);
    const toast = screen.getByRole('alert');
    
    expect(toast).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Close notification');
  });

  it('applies custom className', () => {
    render(<Toast {...defaultProps} className="custom-class" />);
    expect(screen.getByRole('alert')).toHaveClass('custom-class');
  });
}); 