import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
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
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders fallback when there is an error', () => {
    const fallback = ({ error }) => (
      <div>Error occurred: {error.message}</div>
    );

    render(
      <ErrorBoundary fallback={fallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error occurred: Test error')).toBeInTheDocument();
  });

  it('handles errors thrown after initial render', async () => {
    render(
      <ErrorBoundary>
        <ThrowErrorButton />
      </ErrorBoundary>
    );

    const button = screen.getByText('Throw Error');
    fireEvent.click(button);

    vi.runAllTimers();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('calls onError when provided', () => {
    const onError = vi.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('withErrorBoundary', () => {
  it('wraps component with error boundary', () => {
    const TestComponent = () => <div>Test content</div>;
    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent />);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('passes custom fallback to error boundary', () => {
    const fallback = ({ error }) => (
      <div>Custom error: {error.message}</div>
    );

    const TestComponent = () => { throw new Error('Test error'); };
    const WrappedComponent = withErrorBoundary(TestComponent, { fallback });

    render(<WrappedComponent />);
    expect(screen.getByText('Custom error: Test error')).toBeInTheDocument();
  });
}); 