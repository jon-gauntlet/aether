import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

// Test component that throws error
function Bomb({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return null;
}

describe('ErrorBoundary', () => {
  // Prevent console.error spam during tests
  const consoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  
  afterAll(() => {
    console.error = consoleError;
  });

  // Natural flow: setup → error → verify
  describe('Error Flow', () => {
    it('renders children when no error', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('renders error UI when error occurs', () => {
      render(
        <ErrorBoundary>
          <Bomb shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Error: Test error')).toBeInTheDocument();
    });

    it('calls onError when error occurs', () => {
      const handleError = jest.fn();
      
      render(
        <ErrorBoundary onError={handleError}>
          <Bomb shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(handleError).toHaveBeenCalledTimes(1);
      expect(handleError.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(handleError.mock.calls[0][0].message).toBe('Test error');
    });
  });

  describe('Fallback Flow', () => {
    it('renders custom fallback when provided', () => {
      const fallback = (error) => (
        <div>Custom error: {error.message}</div>
      );
      
      render(
        <ErrorBoundary fallback={fallback}>
          <Bomb shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Custom error: Test error')).toBeInTheDocument();
    });
  });

  describe('Recovery Flow', () => {
    it('resets error state when children change', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <Bomb shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      
      rerender(
        <ErrorBoundary>
          <div>Recovered content</div>
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Recovered content')).toBeInTheDocument();
    });
  });

  describe('Development Flow', () => {
    const NODE_ENV = process.env.NODE_ENV;
    
    beforeAll(() => {
      process.env.NODE_ENV = 'development';
    });
    
    afterAll(() => {
      process.env.NODE_ENV = NODE_ENV;
    });

    it('shows stack trace in development', () => {
      render(
        <ErrorBoundary>
          <Bomb shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Stack trace')).toBeInTheDocument();
    });
  });
}); 