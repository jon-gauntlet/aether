import React, { useCallback } from 'react'
import { Box, Input, Button, Text } from '@chakra-ui/react'

const DEFAULT_MAX_LENGTH = 500

const ChatInput = ({ onSendMessage, isLoading, maxLength = DEFAULT_MAX_LENGTH }) => {
  const [message, setMessage] = React.useState('')
  const remainingChars = maxLength - message.length
  const showCharCount = remainingChars <= 50

  const handleSend = useCallback(() => {
    if (message.trim()) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }, [message, onSendMessage])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Don't prevent default - let the newline be inserted
        return
      } else {
        e.preventDefault()
        handleSend()
      }
    }
  }, [handleSend])

  const handleChange = useCallback((e) => {
    const newValue = e.target.value
    if (newValue.length <= maxLength) {
      setMessage(newValue)
    }
  }, [maxLength])

  return (
    <Box position="relative">
      <Box display="flex" gap={2}>
        <Input
          as="textarea"
          data-testid="message-input"
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={isLoading}
          rows={1}
          resize="none"
          minHeight="40px"
          pr={showCharCount ? "120px" : "70px"}
        />
        <Button
          data-testid="send-button"
          onClick={handleSend}
          isDisabled={!message.trim() || isLoading}
          position="absolute"
          right={2}
          top="50%"
          transform="translateY(-50%)"
        >
          Send
        </Button>
      </Box>
      {showCharCount && (
        <Text 
          data-testid="char-count"
          fontSize="sm" 
          color="gray.500" 
          position="absolute"
          right="70px"
          top="50%"
          transform="translateY(-50%)"
        >
          {remainingChars} characters remaining
        </Text>
      )}
    </Box>
  )
}

export default ChatInput 