import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Box, VStack, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton } from '@chakra-ui/react'
import { ChatMessageList } from './ChatMessageList'
import ChatInput from './ChatInput'
import { FileUpload } from './FileUpload'

const MOCK_USER = {
  id: 'demo-user',
  name: 'Demo User',
  email: 'demo@example.com'
};

export default function ChatContainer() {
  const [messages, setMessages] = useState([])
  const [isConnected, setIsConnected] = useState(true) // Default to connected for demo
  const toast = useToast()

  const handleSendMessage = useCallback((content) => {
    const newMessage = {
      id: Date.now(),
      content,
      sender: MOCK_USER,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  return (
    <Box h="100vh" p={4}>
      <VStack h="full" spacing={4}>
        <Box flex="1" overflowY="auto">
          <ChatMessageList 
            messages={messages}
          />
        </Box>

        <FileUpload channel="general" />

        <ChatInput 
          onSendMessage={handleSendMessage}
          isConnected={isConnected}
        />
      </VStack>
    </Box>
  )
} 