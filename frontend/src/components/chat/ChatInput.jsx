import React, { useState } from 'react'
import { Box, Input, Button, HStack, IconButton, Tooltip, useColorModeValue } from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'

const ChatInput = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('')
  const [isRAGMode, setIsRAGMode] = useState(false)
  
  const ragButtonBg = useColorModeValue('purple.100', 'purple.800')
  const ragActiveButtonBg = useColorModeValue('purple.200', 'purple.600')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!message.trim()) return
    
    onSendMessage(message, { useRAG: isRAGMode })
    setMessage('')
  }

  const handleKeyPress = (e) => {
    if (e.key === '/') {
      if (message === '') {
        e.preventDefault()
        setIsRAGMode(true)
      }
    }
  }

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <HStack>
        <Tooltip 
          label={isRAGMode ? "RAG Mode Active - Using AI to search and respond" : "Toggle RAG Mode (or type / to activate)"} 
          placement="top"
        >
          <IconButton
            icon={<SearchIcon />}
            aria-label="Toggle RAG Mode"
            onClick={() => setIsRAGMode(!isRAGMode)}
            bg={isRAGMode ? ragActiveButtonBg : 'transparent'}
            _hover={{ bg: ragButtonBg }}
            size="md"
          />
        </Tooltip>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={isRAGMode ? "Ask anything (RAG enabled)..." : "Type a message..."}
          isDisabled={isLoading}
          bg={isRAGMode ? ragButtonBg : 'transparent'}
          _focus={{ bg: isRAGMode ? ragActiveButtonBg : 'transparent' }}
        />
        <Button 
          type="submit" 
          isDisabled={isLoading || !message.trim()}
          colorScheme={isRAGMode ? "purple" : "blue"}
        >
          Send
        </Button>
      </HStack>
    </Box>
  )
}

export default ChatInput 