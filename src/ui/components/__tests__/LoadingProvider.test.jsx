import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { LoadingProvider, useLoading } from '../LoadingProvider';

const TestComponent = () => {
  const { isLoading, withLoading } = useLoading();
  
  const handleClick = () => {
    withLoading('test', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  };

  return (
    <div>
      <div data-testid="loading-state">{isLoading('test').toString()}</div>
      <button onClick={handleClick}>Start Loading</button>
    </div>
  );
};

describe('LoadingProvider', () => {
  it('provides loading state to children', () => {
    render(
      <LoadingProvider>
        <TestComponent />
      </LoadingProvider>
    );
    
    expect(screen.getByTestId('loading-state')).toHaveTextContent('false');
  });

  it('updates loading state during async operations', async () => {
    render(
      <LoadingProvider>
        <TestComponent />
      </LoadingProvider>
    );
    
    const button = screen.getByText('Start Loading');
    await act(async () => {
      button.click();
      expect(screen.getByTestId('loading-state')).toHaveTextContent('true');
      await new Promise(resolve => setTimeout(resolve, 150));
    });
    
    expect(screen.getByTestId('loading-state')).toHaveTextContent('false');
  });

  it('handles multiple loading states', async () => {
    const TestMultipleLoading = () => {
      const { isLoading, withLoading } = useLoading();
      
      const startLoading = (key) => {
        withLoading(key, async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
      };

      return (
        <div>
          <div data-testid="loading-1">{isLoading('test1').toString()}</div>
          <div data-testid="loading-2">{isLoading('test2').toString()}</div>
          <button onClick={() => startLoading('test1')}>Load 1</button>
          <button onClick={() => startLoading('test2')}>Load 2</button>
        </div>
      );
    };

    render(
      <LoadingProvider>
        <TestMultipleLoading />
      </LoadingProvider>
    );
    
    const button1 = screen.getByText('Load 1');
    const button2 = screen.getByText('Load 2');

    await act(async () => {
      button1.click();
      button2.click();
      expect(screen.getByTestId('loading-1')).toHaveTextContent('true');
      expect(screen.getByTestId('loading-2')).toHaveTextContent('true');
      await new Promise(resolve => setTimeout(resolve, 150));
    });
    
    expect(screen.getByTestId('loading-1')).toHaveTextContent('false');
    expect(screen.getByTestId('loading-2')).toHaveTextContent('false');
  });

  it('handles errors during loading', async () => {
    const TestErrorLoading = () => {
      const { isLoading, withLoading } = useLoading();
      
      const throwError = () => {
        withLoading('error', async () => {
          throw new Error('Test error');
        });
      };

      return (
        <div>
          <div data-testid="loading-state">{isLoading('error').toString()}</div>
          <button onClick={throwError}>Throw Error</button>
        </div>
      );
    };

    render(
      <LoadingProvider>
        <TestErrorLoading />
      </LoadingProvider>
    );
    
    const button = screen.getByText('Throw Error');
    
    await act(async () => {
      button.click();
      expect(screen.getByTestId('loading-state')).toHaveTextContent('true');
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    
    expect(screen.getByTestId('loading-state')).toHaveTextContent('false');
  });
}); 