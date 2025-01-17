import React from 'react'
import PropTypes from 'prop-types'
import { showToast } from './ToastContainer'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    
    // Show toast for non-fatal errors
    if (!this.props.isFatal) {
      showToast({
        message: 'An error occurred. The application will attempt to recover.',
        type: 'error',
        duration: 5000
      })
    }

    // Log error to error reporting service
    if (import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true') {
      console.error('UI Error:', {
        error,
        errorInfo,
        location: window.location.href,
        timestamp: new Date().toISOString()
      })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    this.props.onRetry?.()
  }

  handleReport = () => {
    // Implement error reporting logic
    showToast({
      message: 'Error report submitted. Thank you for your feedback.',
      type: 'success'
    })
  }

  render() {
    const { hasError, error, errorInfo } = this.state
    const { fallback, children, isFatal = false } = this.props

    if (hasError) {
      if (fallback) {
        return fallback({ error, errorInfo, onRetry: this.handleRetry })
      }

      return (
        <div className="p-6 rounded-lg bg-red-50 border border-red-100 max-w-2xl mx-auto my-8">
          <div className="flex items-center space-x-3 text-red-600 mb-4">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-lg font-medium">
              {isFatal ? 'Fatal Error' : 'Something went wrong'}
            </h3>
          </div>
          
          <div className="bg-white rounded p-4 mb-4 overflow-auto max-h-48">
            <p className="text-sm text-red-500 font-mono whitespace-pre-wrap">
              {error?.message || 'An unexpected error occurred'}
              {errorInfo?.componentStack && (
                '\n\nComponent Stack:\n' + errorInfo.componentStack
              )}
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Try Again
            </button>
            <button
              onClick={this.handleReport}
              className="px-4 py-2 border border-red-200 text-red-600 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Report Issue
            </button>
          </div>

          {!isFatal && (
            <p className="mt-4 text-sm text-gray-500">
              You can continue using the application. If the problem persists,
              please refresh the page or contact support.
            </p>
          )}
        </div>
      )
    }

    return children
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.func,
  isFatal: PropTypes.bool,
  onRetry: PropTypes.func
}

export default ErrorBoundary 