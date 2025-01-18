import React from 'react';
import { Box, Text, Button } from '@chakra-ui/react';

export class ErrorBoundary extends React.Component {
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

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box data-testid="error-ui" textAlign="center" p={4}>
          <Text mb={4}>Something went wrong. Please try again.</Text>
          <Button onClick={this.handleTryAgain}>Try again</Button>
        </Box>
      );
    }

    return this.props.children;
  }
} 