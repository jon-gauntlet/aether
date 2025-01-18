import { VStack, Text, Skeleton } from '@chakra-ui/react';
import { Message } from './Message';
import { withErrorBoundary } from './ErrorBoundary';

const ChatMessageListComponent = ({ messages = [], isLoading, error }) => {
  if (error) {
    return (
      <Text color="red.500" role="alert">
        {error}
      </Text>
    );
  }

  if (isLoading) {
    return (
      <VStack spacing={4} align="stretch" data-testid="chat-message-list">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} height="100px" data-testid="skeleton" />
        ))}
      </VStack>
    );
  }

  if (!messages.length) {
    return (
      <VStack spacing={4} align="stretch" data-testid="chat-message-list">
        <Text color="gray.500" textAlign="center">
          No messages yet
        </Text>
      </VStack>
    );
  }

  return (
    <VStack spacing={4} align="stretch" data-testid="chat-message-list">
      {messages.map((message) => (
        <Message
          key={message.id}
          message={message}
          isUser={message.role === 'user'}
        />
      ))}
    </VStack>
  );
};

export const ChatMessageList = withErrorBoundary(ChatMessageListComponent); 