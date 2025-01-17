import React, { useState } from 'react';
import { VStack, Input, Button, Text } from '@chakra-ui/react';
import { withErrorBoundary } from './ErrorBoundary';

const MAX_LENGTH = 1000;
const NEAR_LIMIT_THRESHOLD = 50;

function ChatInputComponent({ onSendMessage, isLoading = false }) {
  const [message, setMessage] = useState('');
  const isNearLimit = MAX_LENGTH - message.length <= NEAR_LIMIT_THRESHOLD;
  const trimmedMessage = message.trim();
  const isDisabled = isLoading || !trimmedMessage || message.length > MAX_LENGTH;

  const handleSubmit = () => {
    if (!trimmedMessage) {
      return;
    }
    onSendMessage(trimmedMessage);
    setMessage('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <VStack spacing={2} align="stretch">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        maxLength={MAX_LENGTH}
        isDisabled={isLoading}
        data-testid="chat-input"
      />
      {isNearLimit && (
        <Text fontSize="sm" color={message.length > MAX_LENGTH ? 'red.500' : 'gray.500'} data-testid="char-count">
          {message.length}/{MAX_LENGTH}
        </Text>
      )}
      <Button
        onClick={handleSubmit}
        isDisabled={isDisabled}
        isLoading={isLoading}
        data-testid="send-button"
      >
        Send
      </Button>
    </VStack>
  );
}

export const ChatInput = withErrorBoundary(ChatInputComponent); 