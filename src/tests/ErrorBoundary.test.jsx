import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { withFlowProtection, createDebugContext, withDebugProtection } from '../core/__tests__/utils/debug-utils';

const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  let debugContext;

  beforeEach(() => {
    vi.clearAllMocks();
    debugContext = createDebugContext();
  });

  it('renders children when no error occurs', withFlowProtection(async () => {
    withDebugProtection(() => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    }, debugContext);
  }));

  it('renders error UI when an error occurs', withFlowProtection(async () => {
    withDebugProtection(() => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-ui')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
    }, debugContext);
  }));

  it('resets error state when try again is clicked', withFlowProtection(async () => {
    withDebugProtection(() => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByText('Try again');
      fireEvent.click(tryAgainButton);

      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    }, debugContext);
  }));

  it('calls onError prop when an error occurs', withFlowProtection(async () => {
    withDebugProtection(() => {
      const onError = vi.fn();
      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.any(Object));
    }, debugContext);
  }));

  afterEach(() => {
    const analysis = analyzeDebugContext(debugContext);
    if (analysis.warningCount > 0) {
      console.warn('Test optimization recommendations:', analysis.recommendations);
    }
  });
}); 