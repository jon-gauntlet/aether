import { Component } from 'react'

class FilesErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }))

    // Log file-specific error details
    console.error({
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      component: errorInfo.componentStack,
      route: 'files',
      timestamp: new Date().toISOString(),
      errorCount: this.state.errorCount + 1
    })
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    const { hasError, error, errorCount } = this.state

    if (hasError) {
      // Show critical error after 3 failures
      if (errorCount >= 3) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50" data-testid="error-boundary-critical">
            <div className="max-w-md w-full p-8 bg-red-50 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-red-600 mb-4">
                Unable to Load Files
              </h2>
              <p className="text-red-700 mb-4">
                We're having trouble loading the files section. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50" data-testid="error-boundary">
          <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              File Loading Error
            </h2>
            <div className="bg-red-50 p-4 rounded-md mb-4">
              <p className="text-sm text-red-700">
                {error?.message || 'Failed to load files'}
              </p>
            </div>
            <button
              onClick={this.handleRetry}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              data-testid="error-retry-button"
            >
              Try Again
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="text-sm text-gray-500 cursor-pointer">
                  Error Details
                </summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded-md text-xs overflow-auto">
                  {error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default FilesErrorBoundary 