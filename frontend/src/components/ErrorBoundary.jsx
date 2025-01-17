import { Box, Button, Heading, Text } from '@chakra-ui/react';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <Box
      role="alert"
      p={4}
      bg="red.600"
      color="white"
      borderRadius="md"
      m={4}
    >
      <Heading size="md" mb={2}>Something went wrong</Heading>
      <Text mb={4}>{error.message}</Text>
      <Button
        onClick={resetErrorBoundary}
        colorScheme="whiteAlpha"
      >
        Try again
      </Button>
    </Box>
  );
}

export function withErrorBoundary(Component, options = {}) {
  return function WithErrorBoundary(props) {
    return (
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => {
          // Reset the state of your app here
          options.onReset?.();
        }}
        {...options}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };
} 