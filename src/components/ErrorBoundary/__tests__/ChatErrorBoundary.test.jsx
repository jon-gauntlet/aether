import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ChatErrorBoundary from '../ChatErrorBoundary';

// Test components
const ThrowNetworkError = () => {
  const error = new Error('Failed to connect to WebSocket');
  error.name = 'NetworkError';
  throw error;
};

const ThrowChatError = () => {
  throw new Error('Failed to send message');
};

describe('ChatErrorBoundary', () => {
  // Prevent error logging during tests
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('renders children when no error occurs', () => {
    render(
      <ChatErrorBoundary>
        <div>Chat content</div>
      </ChatErrorBoundary>
    );
    expect(screen.getByText('Chat content')).toBeInTheDocument();
  });

  it('renders chat error UI when an error occurs', () => {
    render(
      <ChatErrorBoundary>
        <ThrowChatError />
      </ChatErrorBoundary>
    );
    expect(screen.getByText(/chat error/i)).toBeInTheDocument();
    expect(screen.getByText(/failed to send message/i)).toBeInTheDocument();
    expect(screen.getByTestId('chat-error-retry-button')).toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ChatErrorBoundary>
        <ThrowChatError />
      </ChatErrorBoundary>
    );

    expect(screen.getByText(/error details/i)).toBeInTheDocument();
    const details = screen.getByText(/error details/i).parentElement;
    fireEvent.click(details.querySelector('summary'));
    expect(details.querySelector('pre')).toBeInTheDocument();

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('tracks connection attempts for network errors', () => {
    const onError = vi.fn();
    render(
      <ChatErrorBoundary onError={onError}>
        <ThrowNetworkError />
      </ChatErrorBoundary>
    );

    // Verify that connection attempts are tracked
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'NetworkError',
        message: expect.stringContaining('WebSocket')
      }),
      expect.any(Object)
    );

    // Error UI should show both retry and reload options
    expect(screen.getByText(/try again/i)).toBeInTheDocument();
    expect(screen.getByText(/reload page/i)).toBeInTheDocument();
  });

  it('resets connection attempts after 30 minutes', () => {
    vi.useFakeTimers();
    const onError = vi.fn();

    render(
      <ChatErrorBoundary onError={onError}>
        <ThrowNetworkError />
      </ChatErrorBoundary>
    );

    // First error
    expect(onError).toHaveBeenCalledTimes(1);

    // Try again
    fireEvent.click(screen.getByTestId('chat-error-retry-button'));

    // Advance time by 30 minutes
    act(() => {
      vi.advanceTimersByTime(1800000);
    });

    // Connection attempts should be reset
    expect(onError).toHaveBeenCalledTimes(2);
  });

  it('calls parent onError handler', () => {
    const onError = vi.fn();
    render(
      <ChatErrorBoundary onError={onError}>
        <ThrowChatError />
      </ChatErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('allows retry after error', () => {
    const { rerender } = render(
      <ChatErrorBoundary>
        <ThrowChatError />
      </ChatErrorBoundary>
    );

    expect(screen.getByText(/chat error/i)).toBeInTheDocument();
    
    fireEvent.click(screen.getByTestId('chat-error-retry-button'));
    
    rerender(
      <ChatErrorBoundary>
        <div>Chat restored</div>
      </ChatErrorBoundary>
    );

    expect(screen.getByText('Chat restored')).toBeInTheDocument();
  });

  it('cleans up reset interval on unmount', () => {
    vi.useFakeTimers();
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    
    const { unmount } = render(
      <ChatErrorBoundary>
        <div>Chat content</div>
      </ChatErrorBoundary>
    );

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
}); 