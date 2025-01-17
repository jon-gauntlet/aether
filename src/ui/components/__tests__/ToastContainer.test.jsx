import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import ToastContainer, { showToast, setToastContainer } from '../ToastContainer';

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders without toasts initially', () => {
    render(<ToastContainer />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows toast when showToast is called', () => {
    const containerRef = { current: null };
    render(<ToastContainer ref={containerRef} />);
    
    act(() => {
      setToastContainer(containerRef.current);
      showToast({ message: 'Test toast', type: 'info' });
    });

    expect(screen.getByText('Test toast')).toBeInTheDocument();
  });

  it('removes toast after duration', async () => {
    const containerRef = { current: null };
    render(<ToastContainer ref={containerRef} />);
    
    act(() => {
      setToastContainer(containerRef.current);
      showToast({ message: 'Test toast', duration: 1000 });
    });

    expect(screen.getByText('Test toast')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.queryByText('Test toast')).not.toBeInTheDocument();
  });

  it('handles multiple toasts', () => {
    const containerRef = { current: null };
    render(<ToastContainer ref={containerRef} />);
    
    act(() => {
      setToastContainer(containerRef.current);
      showToast({ message: 'Toast 1', type: 'info' });
      showToast({ message: 'Toast 2', type: 'success' });
      showToast({ message: 'Toast 3', type: 'error' });
    });

    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
    expect(screen.getByText('Toast 3')).toBeInTheDocument();
  });

  it('removes specific toast when closed', () => {
    const containerRef = { current: null };
    render(<ToastContainer ref={containerRef} />);
    
    act(() => {
      setToastContainer(containerRef.current);
      showToast({ message: 'Toast 1', type: 'info' });
      showToast({ message: 'Toast 2', type: 'success' });
    });

    const closeButtons = screen.getAllByRole('button');
    act(() => {
      closeButtons[0].click();
    });

    expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
  });

  it('has correct ARIA attributes', () => {
    const containerRef = { current: null };
    render(<ToastContainer ref={containerRef} />);
    
    act(() => {
      setToastContainer(containerRef.current);
      showToast({ message: 'Test toast' });
    });

    const container = screen.getByRole('region');
    expect(container).toHaveAttribute('aria-live', 'polite');
    expect(container).toHaveAttribute('aria-label', 'Notifications');
  });

  it('applies custom className', () => {
    const containerRef = { current: null };
    render(<ToastContainer ref={containerRef} className="custom-class" />);
    expect(screen.getByRole('region')).toHaveClass('custom-class');
  });

  it('limits maximum number of toasts', () => {
    const containerRef = { current: null };
    render(<ToastContainer ref={containerRef} maxToasts={2} />);
    
    act(() => {
      setToastContainer(containerRef.current);
      showToast({ message: 'Toast 1' });
      showToast({ message: 'Toast 2' });
      showToast({ message: 'Toast 3' });
    });

    expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
    expect(screen.getByText('Toast 3')).toBeInTheDocument();
  });
}); 