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
    if (this.props.onError) {
      this.props.onError(error)
    }
  }

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box p={4} borderRadius="md" bg="red.100" color="red.900">
          <VStack spacing={4} align="stretch">
            <Text fontWeight="bold">Something went wrong</Text>
            <Text fontSize="sm">{this.state.error?.message}</Text>
            <Button onClick={this.handleTryAgain} colorScheme="red" size="sm">
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