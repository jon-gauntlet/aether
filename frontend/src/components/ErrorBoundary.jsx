import React from 'react'
import { Box, Button, Text, VStack } from '@chakra-ui/react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.props.onError?.(error, errorInfo)
  }

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box p={4} data-testid="error-boundary">
          <VStack spacing={4}>
            <Text color="red.500">Something went wrong</Text>
            <Text fontSize="sm" color="gray.500">
              {this.state.error?.message}
            </Text>
            <Button onClick={this.handleTryAgain} colorScheme="blue">
              Try again
            </Button>
          </VStack>
        </Box>
      )
    }

    return this.props.children
  }
}

export function withErrorBoundary(Component) {
  return function WithErrorBoundaryWrapper(props) {
    return (
      <ErrorBoundary onError={props.onError}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
} 