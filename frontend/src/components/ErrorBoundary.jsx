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
        <Box
          p={4}
          bg="red.500"
          color="white"
          borderRadius="md"
          textAlign="center"
        >
          <Text mb={4}>Something went wrong.</Text>
          <Button
            onClick={() => this.setState({ hasError: false, error: null })}
            colorScheme="whiteAlpha"
          >
            Try again
          </Button>
        </Box>
      )
    }

    return this.props.children
  }
}

export { ErrorBoundary } 