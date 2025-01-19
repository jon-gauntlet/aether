import React from 'react'
import { Box, Text, Button } from '@chakra-ui/react'

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
        <Box p={4} textAlign="center">
          <Text mb={4}>Something went wrong.</Text>
          <Button
            onClick={() => window.location.reload()}
            colorScheme="blue"
          >
            Reload Page
          </Button>
        </Box>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary 