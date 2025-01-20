import React from 'react'
import { Box, Text } from '@chakra-ui/react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box role="alert" p={4} bg="red.100" color="red.900" borderRadius="md">
          <Text fontWeight="bold">Something went wrong</Text>
          <Text>{this.state.error?.message || 'An error occurred'}</Text>
        </Box>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary 