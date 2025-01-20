// IMPLEMENTATION_STATUS: FUNCTIONAL
// WORKING: ["UI components", "basic message display", "RAG integration", "WebSocket connection"]
// MISSING: ["message persistence", "file upload implementation"]

import React, { useState, useEffect, useCallback } from 'react'
import { Box, VStack, useToast } from '@chakra-ui/react'
import { useAuth } from '../../contexts/AuthContext'
import { ChatMessageList } from './ChatMessageList'
import ChatInput from './ChatInput'
import { FileUpload } from './FileUpload'
import { RAGService } from '../../services/rag/ragService'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useRAG } from '../../hooks/useRAG'
import ChatMessage from './ChatMessage'

export const ChatContainer = () => {
  const [messages, setMessages] = useState([])
  const [channel, setChannel] = useState('general')
  const [error, setError] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRAGMode, setIsRAGMode] = useState(false)
  const { user, loading, logout } = useAuth()
  const toast = useToast()
  const ragService = RAGService.getInstance()
  const { isConnected, sendMessage: sendWebSocketMessage } = useWebSocket()
  const { queryRAG, isLoading: isRAGLoading } = useRAG()

  useEffect(() => {
    if (!user) return

    // Load initial messages
    const loadMessages = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const response = await fetch(`/api/messages/${channel}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (!response.ok) throw new Error('Failed to load messages')
        const data = await response.json()
        setMessages(data)
      } catch (err) {
        setError('Failed to load messages')
        toast({
          title: 'Error loading messages',
          status: 'error',
          duration: 3000,
        })
      }
    }

    loadMessages()
  }, [user, channel, toast])

  const handleNewMessage = useCallback((message) => {
    setMessages(prev => [...prev, message])
  }, [])

  const handleSendMessage = useCallback(async (content) => {
    if (!user) return

    try {
      // Add user message immediately for responsiveness
      const userMessage = {
        id: Date.now(),
        content,
        sender: user.id,
        timestamp: new Date().toISOString(),
        role: 'user'
      }
      handleNewMessage(userMessage)

      if (isRAGMode) {
        setIsProcessing(true)
        // Add temporary "thinking" message
        const tempMessage = {
          id: Date.now() + 1,
          content: '',
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          role: 'assistant',
          isLoading: true
        }
        handleNewMessage(tempMessage)

        try {
          const ragResponse = await queryRAG(content)
          // Replace temporary message with actual response
          handleNewMessage({
            id: Date.now() + 2,
            content: ragResponse,
            sender: 'assistant',
            timestamp: new Date().toISOString(),
            role: 'assistant',
            isLoading: false
          })

          // Send message through WebSocket for persistence
          if (isConnected) {
            sendWebSocketMessage({
              type: 'message',
              content: ragResponse,
              isRAG: true
            })
          }
        } catch (err) {
          toast({
            title: 'Error processing RAG query',
            description: err.message,
            status: 'error',
            duration: 5000,
          })
          // Remove temporary message
          setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
        } finally {
          setIsProcessing(false)
        }
      } else {
        // Regular message handling
        if (isConnected) {
          const success = sendWebSocketMessage({
            type: 'message',
            content,
            isRAG: false
          })
          if (!success) {
            toast({
              title: 'Message not sent',
              description: 'Failed to send message through WebSocket',
              status: 'error',
              duration: 3000,
            })
          }
        } else {
          toast({
            title: 'Offline Mode',
            description: 'Messages will not be synced until connection is restored',
            status: 'warning',
            duration: 3000,
          })
        }
      }
    } catch (err) {
      setError('Failed to send message')
      toast({
        title: 'Error sending message',
        description: err.message,
        status: 'error',
        duration: 3000,
      })
    }
  }, [user, isRAGMode, isConnected, sendWebSocketMessage, queryRAG, handleNewMessage, toast])

  const handleChannelChange = (e) => {
    setChannel(e.target.value)
  }

  const handleLogout = async () => {
    await logout()
  }

  if (loading) {
    return <Box>Loading...</Box>
  }

  if (!user) {
    return <Box>Please log in to access the chat.</Box>
  }

  return (
    <Box className="chat-container" data-testid="chat-container">
      <VStack spacing={4} align="stretch">
        <Box className="chat-header">
          <select 
            value={channel} 
            onChange={handleChannelChange}
            data-testid="channel-select"
          >
            <option value="general">General</option>
            <option value="random">Random</option>
          </select>
          <button onClick={handleLogout} data-testid="logout-button">
            Logout
          </button>
        </Box>

        {error && <Box role="alert" color="red.500">{error}</Box>}

        <Box flex="1" overflowY="auto">
          <ChatMessageList messages={messages} />
        </Box>

        <FileUpload channel={channel} />

        <ChatInput 
          onSendMessage={handleSendMessage}
          isLoading={isProcessing}
          isConnected={isConnected}
          isRAGMode={isRAGMode}
          onRAGModeToggle={() => setIsRAGMode(!isRAGMode)}
          isRAGLoading={isRAGLoading}
        />
      </VStack>
    </Box>
  )
} 