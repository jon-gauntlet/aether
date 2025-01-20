import React, { useState, useCallback } from 'react'
import { Box, Input, Button, HStack, IconButton, Switch, FormControl, FormLabel, Text } from '@chakra-ui/react'
import { useRAG } from '../hooks/useRAG'

const DEFAULT_MAX_LENGTH = 500

const ChatInput = ({ onSendMessage, isLoading, isConnected, maxLength = DEFAULT_MAX_LENGTH }) => {
  const [message, setMessage] = useState('')
  const [isRAGMode, setIsRAGMode] = useState(false)
  const { query } = useRAG()
  const remainingChars = maxLength - message.length
  const showCharCount = remainingChars <= 50

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!message.trim()) return

    if (isRAGMode) {
      try {
        const response = await query(message)
        onSendMessage(response.answer || 'AI is thinking...')
      } catch (err) {
        console.error('RAG query failed:', err)
        onSendMessage('Sorry, I encountered an error processing your request.')
      }
    } else {
      onSendMessage(message)
    }

    setMessage('')
  }, [message, onSendMessage, isRAGMode, query])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }, [handleSubmit])

  const handleChange = useCallback((e) => {
    const newValue = e.target.value
    if (newValue.length <= maxLength) {
      setMessage(newValue)
    }
  }, [maxLength])

  return (
    <Box as="form" onSubmit={handleSubmit} position="relative">
      <HStack spacing={4}>
        <FormControl display="flex" alignItems="center" maxW="200px">
          <FormLabel htmlFor="rag-mode" mb="0" fontSize="sm">
            AI Mode
          </FormLabel>
          <Switch
            id="rag-mode"
            isChecked={isRAGMode}
            onChange={(e) => setIsRAGMode(e.target.checked)}
            size="sm"
          />
        </FormControl>
        <Input
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={isRAGMode ? "Ask AI anything..." : "Type a message..."}
          disabled={isLoading || !isConnected}
          rows={1}
          resize="none"
          minHeight="40px"
          pr={showCharCount ? "120px" : "70px"}
        />
        <Button
          type="submit"
          colorScheme="blue"
          isLoading={isLoading}
          disabled={!message.trim() || !isConnected}
        >
          Send
        </Button>
      </HStack>
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