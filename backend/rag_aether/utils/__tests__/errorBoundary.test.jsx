import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary } from '../errorBoundary';

// Mock components for testing
const ThrowError = () => {
  throw new Error('Test error');
};

const ThrowErrorButton = () => {
  const [shouldThrow, setShouldThrow] = React.useState(false);
  
  if (shouldThrow) {
    throw new Error('Test error');
  }
  
  return (
    <button onClick={() => setShouldThrow(true)}>
      Throw Error
    </button>
  );
};

// Mock console.error to prevent noise in test output
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    const fallback = ({ error }) => (
      <div>Custom error: {error.message}</div>
    );
    
    render(
      <ErrorBoundary fallback={fallback}>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Custom error: Test error')).toBeInTheDocument();
  });

  it('calls onError prop when error occurs', () => {
    const onError = jest.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('allows retry after error', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorButton />
      </ErrorBoundary>
    );
    
    // Trigger error
    fireEvent.click(screen.getByText('Throw Error'));
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    // Retry
    fireEvent.click(screen.getByText('Try again'));
    expect(screen.getByText('Throw Error')).toBeInTheDocument();
  });

  it('shows critical error after multiple errors', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorButton />
      </ErrorBoundary>
    );
    
    // Trigger error multiple times
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByText('Throw Error'));
      if (i < 2) {
        fireEvent.click(screen.getByText('Try again'));
      }
    }
    
    expect(screen.getByText('Too Many Errors')).toBeInTheDocument();
    expect(screen.getByText('Please refresh the page to continue')).toBeInTheDocument();
  });

  it('resets error count after an hour', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorButton />
      </ErrorBoundary>
    );
    
    // Trigger error twice
    fireEvent.click(screen.getByText('Throw Error'));
    fireEvent.click(screen.getByText('Try again'));
    fireEvent.click(screen.getByText('Throw Error'));
    
    // Fast forward 1 hour
    act(() => {
      jest.advanceTimersByTime(3600000);
    });
    
    // Should be able to retry again
    fireEvent.click(screen.getByText('Try again'));
    expect(screen.getByText('Throw Error')).toBeInTheDocument();
  });
});

describe('withErrorBoundary', () => {
  it('wraps component with error boundary', () => {
    const TestComponent = () => <div>Test content</div>;
    const WrappedComponent = withErrorBoundary(TestComponent);
    
    render(<WrappedComponent />);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('handles errors in wrapped component', () => {
    const WrappedError = withErrorBoundary(ThrowError);
    
    render(<WrappedError />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('passes options to error boundary', () => {
    const fallback = ({ error }) => (
      <div>Custom error: {error.message}</div>
    );
    
    const WrappedError = withErrorBoundary(ThrowError, { fallback });
    
    render(<WrappedError />);
    expect(screen.getByText('Custom error: Test error')).toBeInTheDocument();
  });
}); 