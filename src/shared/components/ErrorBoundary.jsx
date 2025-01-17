import React from 'react';

// Natural flow: error → capture → display
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Natural capture flow
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    // Natural logging flow
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  render() {
    const { error, errorInfo } = this.state;
    const { fallback, children } = this.props;

    // Natural display flow
    if (error) {
      if (fallback) {
        return fallback(error, errorInfo);
      }

      return (
        <div className="p-4 bg-red-50 rounded-lg" role="alert">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Something went wrong
          </h2>
          <div className="text-sm text-red-700">
            {error.toString()}
          </div>
          {process.env.NODE_ENV === 'development' && errorInfo && (
            <details className="mt-2">
              <summary className="text-sm text-red-600 cursor-pointer">
                Stack trace
              </summary>
              <pre className="mt-2 text-xs text-red-600 overflow-auto">
                {errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return children;
  }
}

ErrorBoundary.displayName = 'ErrorBoundary'; 