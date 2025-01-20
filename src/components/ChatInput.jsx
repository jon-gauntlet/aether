import React, { useState, useCallback } from 'react'
import { Box, Input, IconButton, HStack } from '@chakra-ui/react'
import { SendIcon } from 'lucide-react'

export default function ChatInput({ onSendMessage, isDisabled, placeholder = 'Type a message...' }) {
  const [message, setMessage] = useState('')

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    if (!message.trim() || isDisabled) return

    onSendMessage(message)
    setMessage('')
  }, [message, onSendMessage, isDisabled])

  return (
    <Box as="form" onSubmit={handleSubmit} p={4}>
      <HStack>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          disabled={isDisabled}
          _disabled={{
            opacity: 0.6,
            cursor: 'not-allowed'
          }}
        />
        <IconButton
          type="submit"
          icon={<SendIcon size={20} />}
          disabled={!message.trim() || isDisabled}
          colorScheme="blue"
          aria-label="Send message"
        />
      </HStack>
    </Box>
  )
} 