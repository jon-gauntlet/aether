import { Component } from 'react'

class ChatErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Chat error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4">
          <div className="bg-red-50 p-4 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Chat Error
            </h3>
            <p className="text-sm text-red-700 mb-4">
              {this.state.error?.message || 'Failed to load chat'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ChatErrorBoundary 