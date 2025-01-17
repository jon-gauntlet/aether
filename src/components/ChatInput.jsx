import React, { useState } from 'react';
import { VStack, Input, Button, Text } from '@chakra-ui/react';
import { withErrorBoundary } from './ErrorBoundary';

const MAX_LENGTH = 1000;
const NEAR_LIMIT_THRESHOLD = 900;

export const ChatInput = withErrorBoundary(({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      onSendMessage(trimmedMessage);
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isNearLimit = message.length >= NEAR_LIMIT_THRESHOLD;
  const isDisabled = isLoading || !message.trim() || message.length > MAX_LENGTH;

  return (
    <VStack spacing={2} align="stretch">
      <Input
        data-testid="chat-input"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        maxLength={MAX_LENGTH}
        disabled={isLoading}
      />
      {isNearLimit && (
        <Text fontSize="sm" color={message.length > MAX_LENGTH ? 'red.500' : 'gray.500'}>
          {message.length}/{MAX_LENGTH}
        </Text>
      )}
      <Button
        data-testid="send-button"
        onClick={handleSubmit}
        isDisabled={isDisabled}
        colorScheme="blue"
      >
        Send
      </Button>
    </VStack>
  );
}); 