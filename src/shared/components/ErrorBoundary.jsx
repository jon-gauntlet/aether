import React from 'react';
import { Box, Text, Button, useColorModeValue } from '@chakra-ui/react';

// Separate functional component for error UI
const ErrorUI = ({ error, errorInfo, onReset }) => {
  const bgColor = useColorModeValue('red.50', 'red.900');
  const textColor = useColorModeValue('red.800', 'red.200');
  const subTextColor = useColorModeValue('red.700', 'red.300');
  const stackBgColor = useColorModeValue('red.100', 'red.800');

  return (
    <Box
      p={4}
      bg={bgColor}
      borderRadius="md"
      role="alert"
      data-testid="error-boundary"
    >
      <Text
        fontSize="lg"
        fontWeight="semibold"
        color={textColor}
        mb={2}
      >
        Something went wrong
      </Text>
      <Text
        fontSize="sm"
        color={subTextColor}
        mb={4}
      >
        {error?.message}
      </Text>
      {process.env.NODE_ENV === 'development' && (
        <Box
          mt={2}
          p={3}
          bg={stackBgColor}
          borderRadius="sm"
        >
          <Text
            fontSize="sm"
            fontWeight="medium"
            color={textColor}
            cursor="pointer"
            mb={2}
          >
            Stack trace
          </Text>
          <Box
            as="pre"
            fontSize="xs"
            color={subTextColor}
            overflowX="auto"
            whiteSpace="pre-wrap"
          >
            {errorInfo?.componentStack}
          </Box>
        </Box>
      )}
      <Button
        mt={4}
        colorScheme="red"
        size="sm"
        onClick={onReset}
        data-testid="error-retry-button"
      >
        Try again
      </Button>
    </Box>
  );
};

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.FallbackComponent) {
        return <this.props.FallbackComponent error={this.state.error} errorInfo={this.state.errorInfo} />;
      }
      return (
        <ErrorUI
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.displayName = 'ErrorBoundary'; 