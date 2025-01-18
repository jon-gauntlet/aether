import React from 'react';
import { VStack, Text, Button } from '@chakra-ui/react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <VStack spacing={4} p={4} align="center">
          <Text fontSize="lg" fontWeight="bold">Something went wrong</Text>
          <Text color="gray.600">{this.state.error?.message}</Text>
          <Button onClick={this.handleReset} colorScheme="blue">
            Try again
          </Button>
        </VStack>
      );
    }

    return this.props.children;
  }
}

export const withErrorBoundary = (Component) => {
  const WithErrorBoundary = (props) => (
    <ErrorBoundary onError={props.onError} onReset={props.onReset}>
      <Component {...props} />
    </ErrorBoundary>
  );
  WithErrorBoundary.displayName = `WithErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  return WithErrorBoundary;
}; 