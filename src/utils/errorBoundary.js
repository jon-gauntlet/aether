import React from 'react';
import { createDebugger } from './debug';

const debug = createDebugger('ErrorBoundary');

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      error: null, 
      errorInfo: null,
      errorCount: 0,
      lastError: null
    };
  }
  
  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    // Track error count and timing
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
      lastError: new Date().toISOString()
    }));

    // Enhanced error logging
    debug.error({
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

  // Attempt recovery after error
  handleRetry = () => {
    this.setState({ 
      error: null, 
      errorInfo: null 
    });
  };

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

  render() {
    const { error, errorInfo, errorCount } = this.state;
    const { fallback, children } = this.props;

    // If error threshold exceeded, show permanent error state
    if (errorCount >= 3) {
      return (
        <div className="error-boundary error-boundary--critical">
          <h2>Too Many Errors</h2>
          <p>Please refresh the page to continue.</p>
        </div>
      );
    }

    // If there's an error, show error UI
    if (error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback({ error, errorInfo, onRetry: this.handleRetry });
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <button 
            onClick={this.handleRetry}
            className="error-boundary__retry-button"
          >
            Try again
          </button>
          <details className="error-boundary__details">
            <summary>Error Details</summary>
            <pre className="error-boundary__stack">
              {error.toString()}
              {errorInfo?.componentStack}
            </pre>
          </details>
        </div>
      );
    }

    // No error, render children
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

// Default styles for error boundary
const styles = `
.error-boundary {
  padding: 20px;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  background-color: #f8d7da;
  color: #721c24;
  margin: 10px 0;
}

.error-boundary--critical {
  background-color: #dc3545;
  color: white;
  border-color: #dc3545;
}

.error-boundary__retry-button {
  background-color: #0d6efd;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin: 10px 0;
}

.error-boundary__retry-button:hover {
  background-color: #0b5ed7;
}

.error-boundary__details {
  margin-top: 10px;
}

.error-boundary__stack {
  margin-top: 10px;
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 0.9em;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
} 