import React from 'react';
import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { TestWrapper } from '@/test/utils';

const ThrowError = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error occurs', () => {
    const { getByText } = render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      </TestWrapper>
    );
    expect(getByText('No error')).toBeInTheDocument();
  });

  it('displays error message when error occurs', () => {
    const { getByText } = render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </TestWrapper>
    );
    expect(getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const { getByText } = render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(getByText(/test error/i)).toBeInTheDocument();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('uses custom fallback component', () => {
    const CustomFallback = ({ error }) => <div>Custom error: {error.message}</div>;
    const { getByText } = render(
      <TestWrapper>
        <ErrorBoundary FallbackComponent={CustomFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </TestWrapper>
    );
    expect(getByText(/custom error: test error/i)).toBeInTheDocument();
  });

  it('resets error state when children change', () => {
    const { getByText, rerender } = render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(getByText(/something went wrong/i)).toBeInTheDocument();

    rerender(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(getByText('No error')).toBeInTheDocument();
  });

  it('provides development error details', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const { getByText } = render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(getByText(/test error/i)).toBeInTheDocument();
    expect(getByText(/error stack/i)).toBeInTheDocument();

    process.env.NODE_ENV = originalNodeEnv;
  });
}); 