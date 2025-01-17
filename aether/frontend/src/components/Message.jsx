import { Box, Text, VStack, Skeleton } from '@chakra-ui/react';
import { withErrorBoundary } from './ErrorBoundary';

const MessageComponent = ({ message, isUser }) => {
  if (message.isLoading) {
    return (
      <Box
        data-testid="message-loading"
        bg={isUser ? 'blue.500' : 'gray.700'}
        color="white"
        p={4}
        borderRadius="lg"
        maxW="80%"
        alignSelf={isUser ? 'flex-end' : 'flex-start'}
      >
        <Skeleton height="20px" />
      </Box>
    );
  }

  return (
    <Box
      data-testid={`message-${isUser ? 'user' : 'assistant'}`}
      bg={isUser ? 'blue.500' : 'gray.700'}
      color="white"
      p={4}
      borderRadius="lg"
      maxW="80%"
      alignSelf={isUser ? 'flex-end' : 'flex-start'}
    >
      <VStack align="stretch" spacing={2}>
        <Text>{message.content}</Text>
        
        {message.code && (
          <Box
            data-testid="code-block"
            mt={2}
            p={2}
            bg="gray.800"
            borderRadius="md"
            fontFamily="mono"
          >
            <pre>{message.code}</pre>
          </Box>
        )}
        
        {message.error && (
          <Text color="red.300" data-testid="message-error">
            {message.error}
          </Text>
        )}
        
        {message.timestamp && (
          <Text
            data-testid="message-timestamp"
            fontSize="xs"
            color="gray.300"
            mt={2}
          >
            {new Date(message.timestamp).toLocaleTimeString()}
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export const Message = withErrorBoundary(MessageComponent); 