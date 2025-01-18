import React from 'react';
import { useColorModeValue } from '@chakra-ui/react';

// Separate functional component for error UI
const ErrorUI = ({ error, errorInfo, onReset, errorCount }) => {
  const bgColor = useColorModeValue('red.50', 'red.900');
  const textColor = useColorModeValue('red.800', 'red.200');
  const subTextColor = useColorModeValue('red.700', 'red.300');
  const stackBgColor = useColorModeValue('red.100', 'red.800');

  // If error threshold exceeded, show permanent error state
  if (errorCount >= 3) {
    return (
      <div className="error-boundary error-boundary--critical" data-testid="error-boundary-critical">
        <h2 className="text-xl font-semibold mb-2">Too Many Errors</h2>
        <p className="text-sm mb-4">Please refresh the page to continue.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div 
      className="error-boundary p-4 rounded-lg shadow-lg"
      role="alert"
      data-testid="error-boundary"
    >
      <h2 className="text-xl font-semibold text-red-600 mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-red-700 mb-4">
        {error?.message || 'An unexpected error occurred'}
      </p>
      {process.env.NODE_ENV === 'development' && errorInfo && (
        <details className="mb-4">
          <summary className="text-sm font-medium text-red-700 cursor-pointer">
            Error Details
          </summary>
          <pre className="mt-2 p-4 bg-red-50 rounded-md text-xs overflow-auto whitespace-pre-wrap font-mono">
            {error?.stack}
            {'\n\nComponent Stack:\n'}
            {errorInfo?.componentStack}
          </pre>
        </details>
      )}
      <button
        onClick={onReset}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        data-testid="error-retry-button"
      >
        Try Again
      </button>
    </div>
  );
};

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastError: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Track error count and timing
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
      lastError: new Date().toISOString()
    }));

    // Enhanced error logging
    console.error({
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      component: errorInfo.componentStack,
      route: window.location.pathname,
      timestamp: new Date().toISOString(),
      errorCount: this.state.errorCount + 1
    });

    // Call error reporting callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  // Reset error count periodically
  componentDidMount() {
    this.resetInterval = setInterval(() => {
      if (this.state.errorCount > 0) {
        this.setState({ errorCount: 0 });
      }
    }, 3600000); // Reset every hour
  }

  componentWillUnmount() {
    if (this.resetInterval) {
      clearInterval(this.resetInterval);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const { FallbackComponent, children } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (FallbackComponent) {
        return <FallbackComponent error={error} errorInfo={errorInfo} onReset={this.handleReset} />;
      }

      // Default error UI
      return (
        <ErrorUI
          error={error}
          errorInfo={errorInfo}
          onReset={this.handleReset}
          errorCount={errorCount}
        />
      );
    }

    return children;
  }
}

// HOC to wrap components with error boundary
export const withErrorBoundary = (Component, options = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `WithErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default ErrorBoundary; 