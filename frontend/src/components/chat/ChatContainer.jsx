// IMPLEMENTATION_STATUS: SKELETON
// WORKING: ["UI components", "basic message display"]
// MISSING: ["real WebSocket connection", "actual message persistence"]
// VERIFICATION: Messages don't persist on reload, WebSocket is mock

import React, { useEffect, useState, useCallback } from 'react'
import { Box, VStack, useToast } from '@chakra-ui/react'
import { useAuth } from '../contexts/AuthContext'
import { ChatMessageList } from './ChatMessageList'
import ChatInput from './ChatInput'
import * as apiClient from '../api/client'
import { FileUpload } from './FileUpload'

function ChatContainer() {
  const [messages, setMessages] = useState([])
  const [channel, setChannel] = useState('general')
  const [error, setError] = useState(null)
  const { user, loading, logout } = useAuth()
  const toast = useToast()

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
      }
    }

    loadMessages()

    // Set up WebSocket connection
    const token = localStorage.getItem('auth_token')
    const ws = new WebSocket(`ws://localhost:8000/ws/${channel}?token=${token}`)
    
    ws.onmessage = (event) => {
      const newMessage = JSON.parse(event.data)
      setMessages(prev => [...prev, newMessage])
    }

    return () => {
      ws.close()
    }
  }, [channel, user])

  const handleSendMessage = useCallback(async (content) => {
    try {
      const result = await apiClient.sendMessage({
        content,
        channel,
        username: user.email,
      })
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      toast({
        title: 'Message sent',
        status: 'success',
        duration: 1000,
      })
    } catch (err) {
      toast({
        title: 'Failed to send message',
        description: err.message,
        status: 'error',
        duration: 3000,
      })
    }
  }, [channel, user, toast])

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
          isLoading={loading}
        />
      </VStack>
    </Box>
  )
}

export default ChatContainer 