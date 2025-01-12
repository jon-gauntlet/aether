import { render } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

describe('ErrorBoundary', () => {
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  it('should render children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <div>Test Content</div>
      </ErrorBoundary>
    );

    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('should render error UI when there is an error', () => {
    const ThrowError = () => {
      throw new Error('Test Error');
      return null;
    };

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeInTheDocument();
    expect(getByText('Test Error')).toBeInTheDocument();
  });

  it('should call onError when an error occurs', () => {
    const onError = jest.fn();
    const error = new Error('Test Error');

    const ThrowError = () => {
      throw error;
      return null;
    };

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(error);
  });

  it('should reset error state when retry is clicked', () => {
    const ThrowError = () => {
      throw new Error('Test Error');
      return null;
    };

    const { getByText, queryByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeInTheDocument();

    const retryButton = getByText('Retry');
    retryButton.click();

    expect(queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('should preserve error details in development mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Test Error');
    error.stack = 'Error\n    at ThrowError';

    const ThrowError = () => {
      throw error;
      return null;
    };

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText(/Error/)).toBeInTheDocument();
    expect(getByText(/at ThrowError/)).toBeInTheDocument();

    process.env.NODE_ENV = originalNodeEnv;
  });
}); 