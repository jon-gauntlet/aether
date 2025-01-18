import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../shared/components/ErrorBoundary';
import { TestWrapper } from './setup';

// Component that throws an error
const ThrowError = () => {
  throw new Error('Test error');
};

// Component that renders normally
const NormalComponent = () => <div>Normal content</div>;

describe('ErrorBoundary', () => {
  // Prevent error logging during tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  
  afterAll(() => {
    console.error = originalError;
  });
  
  it('renders children when no error occurs', () => {
    render(
      <TestWrapper>
        <ErrorBoundary>
          <NormalComponent />
        </ErrorBoundary>
      </TestWrapper>
    );
    
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('renders error UI when an error occurs', () => {
    render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      </TestWrapper>
    );
    
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/test error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('resets error state when try again is clicked', async () => {
    const user = userEvent.setup();
    let shouldThrow = true;
    
    const ToggleError = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Normal content</div>;
    };
    
    render(
      <TestWrapper>
        <ErrorBoundary>
          <ToggleError />
        </ErrorBoundary>
      </TestWrapper>
    );
    
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    
    // Change component behavior and click try again
    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: /try again/i }));
    
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('calls onError prop when an error occurs', () => {
    const onError = vi.fn();
    
    render(
      <TestWrapper>
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      </TestWrapper>
    );
    
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
}); 