import React, { useState, useEffect, useRef } from 'react'
import { VStack, Box, useToast } from '@chakra-ui/react'
import ChatMessageList from './ChatMessageList'
import ChatInput from './ChatInput'

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)
  const toast = useToast()

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL
    wsRef.current = new WebSocket(wsUrl)

    wsRef.current.onopen = () => {
      setConnected(true)
      setLoading(false)
    }

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data)
      setMessages(prev => [...prev, message])
    }

    wsRef.current.onclose = () => {
      setConnected(false)
      toast({
        title: "Connection lost",
        description: "Attempting to reconnect...",
        status: "warning",
        duration: null,
        isClosable: true,
      })
    }

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error)
      toast({
        title: "Connection error",
        description: "Failed to connect to chat server",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [toast])

  const sendMessage = (content) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: "Cannot send message",
        description: "Not connected to chat server",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const message = {
      id: Date.now(),
      content,
      sender: 'user',
      timestamp: new Date().toISOString()
    }

    // Optimistic update
    setMessages(prev => [...prev, message])
    
    wsRef.current.send(JSON.stringify({
      type: 'message',
      content
    }))
  }

  return (
    <VStack h="100vh" spacing={0}>
      <Box flex={1} w="full" overflowY="hidden">
        <ChatMessageList 
          messages={messages} 
          loading={loading} 
        />
      </Box>
      <ChatInput 
        onSendMessage={sendMessage} 
        disabled={!connected}
      />
    </VStack>
  )
} 