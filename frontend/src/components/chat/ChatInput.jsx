import React, { useState } from 'react'
import { Box, Input, Button, HStack } from '@chakra-ui/react'

const ChatInput = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!message.trim()) return
    onSendMessage(message)
    setMessage('')
  }

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <HStack>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          isDisabled={isLoading}
        />
        <Button type="submit" isDisabled={isLoading || !message.trim()}>
          Send
        </Button>
      </HStack>
    </Box>
  )
}

export default ChatInput 