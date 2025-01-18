import React, { useState } from 'react';
import { Box, Button, Textarea, Text } from '@chakra-ui/react';

const MAX_LENGTH = 500;

export const ChatInput = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');
  const remainingChars = MAX_LENGTH - message.length;

  const handleSend = useCallback(() => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  }, [message, onSendMessage]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    if (value.length <= MAX_LENGTH) {
      setMessage(value);
    }
  }, []);

  return (
    <Box>
      <Textarea
        data-testid="message-input"
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={isLoading}
        resize="none"
      />
      {remainingChars <= 50 && (
        <Text fontSize="sm" color={remainingChars === 0 ? 'red.500' : 'gray.500'}>
          {remainingChars} characters remaining
        </Text>
      )}
      <Button
        data-testid="send-button"
        onClick={handleSend}
        isLoading={isLoading}
        isDisabled={!message.trim() || isLoading}
        mt={2}
      >
        Send
      </Button>
    </Box>
  );
}; 