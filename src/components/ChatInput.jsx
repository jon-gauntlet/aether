import React, { useState, useCallback } from 'react';
import { Box, Button, Textarea, Text } from '@chakra-ui/react';

const MAX_LENGTH = 500;

export const ChatInput = ({ onSubmit, disabled, placeholder = 'Type a message...' }) => {
  const [message, setMessage] = useState('');
  const remainingChars = MAX_LENGTH - message.length;

  const handleSend = useCallback(() => {
    if (message.trim()) {
      onSubmit(message.trim());
      setMessage('');
    }
  }, [message, onSubmit]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      setMessage('');
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
        placeholder={placeholder}
        disabled={disabled}
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
        disabled={disabled}
        mt={2}
      >
        Send
      </Button>
    </Box>
  );
}; 