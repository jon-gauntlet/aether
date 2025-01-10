import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock console.error to avoid test noise
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  const ThrowError = ({ message }: { message: string }) => {
    throw new Error(message);
  };

  it('renders children when no error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    );

    expect(getByText('Normal content')).toBeInTheDocument();
  });

  it('renders error UI when error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError message="Test error" />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeInTheDocument();
    expect(getByText(/Test error/)).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    const fallback = <div>Custom error message</div>;
    const { getByText } = render(
      <ErrorBoundary fallback={fallback}>
        <ThrowError message="Test error" />
      </ErrorBoundary>
    );

    expect(getByText('Custom error message')).toBeInTheDocument();
  });

  it('shows retry button and resets on click', async () => {
    let shouldThrow = true;
    const TestComponent = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Recovered content</div>;
    };

    const { getByText } = render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    expect(getByText('Try Again')).toBeInTheDocument();

    // Simulate fix and retry
    shouldThrow = false;
    await userEvent.click(getByText('Try Again'));

    expect(getByText('Recovered content')).toBeInTheDocument();
  });

  it('logs errors to console', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Test error" />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalled();
  });

  it('handles nested errors', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <div>
          <div>
            <ThrowError message="Nested error" />
          </div>
        </div>
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeInTheDocument();
    expect(getByText(/Nested error/)).toBeInTheDocument();
  });

  it('preserves error info in state', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError message="Detailed error" />
      </ErrorBoundary>
    );

    const errorMessage = getByText(/Detailed error/);
    expect(errorMessage.tagName.toLowerCase()).toBe('pre');
    expect(errorMessage).toHaveStyle({
      margin: '1rem 0',
      padding: '1rem',
      background: 'rgba(0, 0, 0, 0.2)',
    });
  });
}); 