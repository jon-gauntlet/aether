import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ErrorBoundary, { withErrorBoundary } from '../ErrorBoundary';

// Test components
const ThrowError = ({ shouldThrow = true, message = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div>No error</div>;
};

const CustomFallback = ({ error, onReset }) => (
  <div>
    <h2>Custom Error UI</h2>
    <p>{error.message}</p>
    <button onClick={onReset}>Custom Reset</button>
  </div>
);

describe('ErrorBoundary', () => {
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
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error UI when an error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/test error/i)).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/error details/i)).toBeInTheDocument();
    const details = screen.getByText(/error details/i).parentElement;
    fireEvent.click(details.querySelector('summary'));
    expect(details.querySelector('pre')).toBeInTheDocument();

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('uses custom fallback component when provided', () => {
    render(
      <ErrorBoundary FallbackComponent={CustomFallback}>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText(/custom error ui/i)).toBeInTheDocument();
    expect(screen.getByText(/test error/i)).toBeInTheDocument();
    expect(screen.getByText(/custom reset/i)).toBeInTheDocument();
  });

  it('calls onError prop when an error occurs', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.any(Object));
  });

  it('resets error state when try again is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('error-retry-button'));

    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('shows critical error UI after 3 errors', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Trigger error multiple times
    for (let i = 0; i < 3; i++) {
      if (i > 0) {
        fireEvent.click(screen.getByTestId('error-retry-button'));
      }
    }

    expect(screen.getByTestId('error-boundary-critical')).toBeInTheDocument();
    expect(screen.getByText(/too many errors/i)).toBeInTheDocument();
    expect(screen.getByText(/refresh the page/i)).toBeInTheDocument();
  });

  it('resets error count after an hour', () => {
    vi.useFakeTimers();

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Trigger error twice
    fireEvent.click(screen.getByTestId('error-retry-button'));
    
    // Advance time by 1 hour
    act(() => {
      vi.advanceTimersByTime(3600000);
    });

    // Error count should be reset, so we shouldn't see the critical error
    fireEvent.click(screen.getByTestId('error-retry-button'));
    expect(screen.queryByTestId('error-boundary-critical')).not.toBeInTheDocument();
  });
});

describe('withErrorBoundary HOC', () => {
  it('wraps component with error boundary', () => {
    const TestComponent = () => <div>Test content</div>;
    const WrappedComponent = withErrorBoundary(TestComponent);
    
    render(<WrappedComponent />);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('handles errors in wrapped component', () => {
    const WrappedError = withErrorBoundary(ThrowError);
    
    render(<WrappedError />);
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('passes options to error boundary', () => {
    const WrappedError = withErrorBoundary(ThrowError, {
      FallbackComponent: CustomFallback
    });
    
    render(<WrappedError />);
    expect(screen.getByText(/custom error ui/i)).toBeInTheDocument();
  });

  it('preserves component display name', () => {
    const TestComponent = () => <div>Test</div>;
    TestComponent.displayName = 'CustomName';
    const WrappedComponent = withErrorBoundary(TestComponent);
    
    expect(WrappedComponent.displayName).toBe('WithErrorBoundary(CustomName)');
  });
}); 