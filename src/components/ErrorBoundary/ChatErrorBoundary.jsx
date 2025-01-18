import React from 'react';
import ErrorBoundary from './ErrorBoundary';

// Custom fallback component for chat errors
const ChatErrorFallback = ({ error, errorInfo, onReset }) => (
  <div className="flex flex-col items-center justify-center h-full p-4">
    <div className="bg-red-50 p-6 rounded-lg max-w-md w-full shadow-lg">
      <h3 className="text-lg font-medium text-red-800 mb-2">
        Chat Error
      </h3>
      <p className="text-sm text-red-700 mb-4">
        {error?.message || 'Failed to load chat'}
      </p>
      {process.env.NODE_ENV === 'development' && (
        <details className="mb-4">
          <summary className="text-sm font-medium text-red-700 cursor-pointer">
            Error Details
          </summary>
          <pre className="mt-2 p-4 bg-red-100 rounded-md text-xs overflow-auto whitespace-pre-wrap font-mono">
            {error?.stack}
            {errorInfo?.componentStack}
          </pre>
        </details>
      )}
      <div className="flex flex-col gap-2">
        <button
          onClick={onReset}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          data-testid="chat-error-retry-button"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="w-full px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
        >
          Reload Page
        </button>
      </div>
    </div>
  </div>
);

class ChatErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      connectionAttempts: 0,
      lastError: null
    };
  }

  handleError = (error, errorInfo) => {
    // Track connection attempts for websocket/network errors
    if (error.name === 'NetworkError' || error.message.includes('WebSocket')) {
      this.setState(prevState => ({
        connectionAttempts: prevState.connectionAttempts + 1,
        lastError: new Date().toISOString()
      }));
    }

    // Log chat-specific error details
    console.error({
      type: 'ChatError',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      component: errorInfo.componentStack,
      connectionAttempts: this.state.connectionAttempts + 1,
      timestamp: new Date().toISOString()
    });

    // Call parent error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  // Reset connection attempts periodically
  componentDidMount() {
    this.resetInterval = setInterval(() => {
      if (this.state.connectionAttempts > 0) {
        this.setState({ connectionAttempts: 0 });
      }
    }, 1800000); // Reset every 30 minutes
  }

  componentWillUnmount() {
    if (this.resetInterval) {
      clearInterval(this.resetInterval);
    }
  }

  render() {
    return (
      <ErrorBoundary
        FallbackComponent={ChatErrorFallback}
        onError={this.handleError}
        {...this.props}
      />
    );
  }
}

export default ChatErrorBoundary; 