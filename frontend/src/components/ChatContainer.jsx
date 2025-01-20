import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Box, VStack, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton } from '@chakra-ui/react'
import { useAuth } from '../contexts/AuthContext'
import { ChatMessageList } from './ChatMessageList'
import ChatInput from './ChatInput'
import * as apiClient from '../api/client'
import { FileUpload } from './FileUpload'
import ReactionDisplay from './ReactionDisplay'

const WEBSOCKET_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws'

export default function ChatContainer() {
  const [messages, setMessages] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [activeThread, setActiveThread] = useState(null)
  const [threadReplies, setThreadReplies] = useState([])
  const wsRef = useRef(null)
  const { user, loading, logout, token } = useAuth()
  const toast = useToast()

  const handleReaction = useCallback((messageId, reaction) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: "Cannot add reaction",
        description: "Not connected to chat server",
        status: "error",
        duration: 3000,
      })
      return
    }
    
    const data = {
      type: 'reaction',
      message_id: messageId,
      reaction,
      user_id: user.id,
      timestamp: new Date().toISOString(),
    }
    
    wsRef.current.send(JSON.stringify(data))
  }, [user, toast])

  const handleReply = useCallback((messageId) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: "Cannot reply",
        description: "Not connected to chat server",
        status: "error",
        duration: 3000,
      })
      return
    }
    
    setActiveThread(messageId)
    // Load thread replies
    wsRef.current.send(JSON.stringify({
      type: 'get_thread_replies',
      message_id: messageId
    }))
  }, [toast])

  const handleThreadClose = useCallback(() => {
    setActiveThread(null)
    setThreadReplies([])
  }, [])

  const sendThreadReply = useCallback((content) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: "Cannot send reply",
        description: "Not connected to chat server",
        status: "error",
        duration: 3000,
      })
      return
    }
    
    const message = {
      type: 'message',
      content,
      user_id: user.id,
      timestamp: new Date().toISOString(),
      parent_id: activeThread
    }
    
    wsRef.current.send(JSON.stringify(message))
  }, [user, activeThread, toast])

  const connect = useCallback(async () => {
    if (!token) return
    
    try {
      const ws = new WebSocket(`${WEBSOCKET_URL}?token=${token}`)
      wsRef.current = ws
      
      ws.onopen = () => {
        setIsConnected(true)
        toast({
          title: 'Connected to chat',
          status: 'success',
          duration: 2000,
        })
      }
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        switch (data.type) {
          case 'message':
            if (data.parent_id) {
              // Thread reply
              if (data.parent_id === activeThread) {
                setThreadReplies(prev => [...prev, data])
              }
            } else {
              // Main message
              setMessages(prev => [...prev, data])
            }
            break
          case 'message_history':
            setMessages(data.messages)
            break
          case 'thread_replies':
            setThreadReplies(data.replies)
            break
          case 'typing':
            setTypingUsers(prev => {
              const newSet = new Set(prev)
              if (data.is_typing) {
                newSet.add(data.user_id)
              } else {
                newSet.delete(data.user_id)
              }
              return newSet
            })
            break
          case 'reaction':
            if (data.parent_id === activeThread) {
              setThreadReplies(prev => prev.map(msg => {
                if (msg.id === data.message_id) {
                  return {
                    ...msg,
                    reactions: [...(msg.reactions || []), {
                      user_id: data.user_id,
                      reaction: data.reaction,
                      timestamp: data.timestamp
                    }]
                  }
                }
                return msg
              }))
            } else {
              setMessages(prev => prev.map(msg => {
                if (msg.id === data.message_id) {
                  return {
                    ...msg,
                    reactions: [...(msg.reactions || []), {
                      user_id: data.user_id,
                      reaction: data.reaction,
                      timestamp: data.timestamp
                    }]
                  }
                }
                return msg
              }))
            }
            break
          case 'remove_reaction':
            if (data.parent_id === activeThread) {
              setThreadReplies(prev => prev.map(msg => {
                if (msg.id === data.message_id) {
                  return {
                    ...msg,
                    reactions: (msg.reactions || []).filter(r => 
                      !(r.user_id === data.user_id && r.reaction === data.reaction)
                    )
                  }
                }
                return msg
              }))
            } else {
              setMessages(prev => prev.map(msg => {
                if (msg.id === data.message_id) {
                  return {
                    ...msg,
                    reactions: (msg.reactions || []).filter(r => 
                      !(r.user_id === data.user_id && r.reaction === data.reaction)
                    )
                  }
                }
                return msg
              }))
            }
            break
          case 'presence':
            // Handle presence updates
            break
        }
      }
      
      ws.onclose = () => {
        setIsConnected(false)
        toast({
          title: 'Disconnected from chat',
          status: 'warning',
          duration: 2000,
        })
        // Attempt to reconnect after 5 seconds
        setTimeout(connect, 5000)
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        toast({
          title: 'Connection error',
          description: 'Failed to connect to chat server',
          status: 'error',
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Failed to connect:', error)
      toast({
        title: 'Connection failed',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }, [token, toast, activeThread])

  useEffect(() => {
    connect()
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  const sendMessage = useCallback((content) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: 'Cannot send message',
        description: 'Not connected to chat server',
        status: 'error',
        duration: 3000,
      })
      return
    }
    
    const message = {
      type: 'message',
      content,
      user_id: user.id,
      timestamp: new Date().toISOString(),
    }
    
    wsRef.current.send(JSON.stringify(message))
  }, [user, toast])

  const setTyping = useCallback((isTyping) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    
    const data = {
      type: 'typing',
      is_typing: isTyping,
      user_id: user.id,
    }
    
    wsRef.current.send(JSON.stringify(data))
  }, [user])

  const handleSendMessage = useCallback(async (content) => {
    try {
      const result = await apiClient.sendMessage({
        content,
        channel: 'general',
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
  }, [user, toast])

  const handleChannelChange = (e) => {
    // Implementation needed
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
    <Box h="100vh" p={4}>
      <VStack h="full" spacing={4}>
        <Box className="chat-header">
          <select 
            value="general" 
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

        <Box flex="1" overflowY="auto">
          <ChatMessageList 
            messages={messages}
            typingUsers={typingUsers}
            onReaction={handleReaction}
            onReply={handleReply}
          />
        </Box>

        <FileUpload channel="general" />

        <ChatInput 
          onSendMessage={sendMessage}
          onTyping={setTyping}
          isConnected={isConnected}
        />
      </VStack>

      {/* Thread Modal */}
      <Modal isOpen={activeThread !== null} onClose={handleThreadClose} size="xl">
        <ModalOverlay />
        <ModalContent maxH="80vh">
          <ModalHeader>Thread</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} h="full">
              {/* Original message */}
              {activeThread && (
                <ChatMessageList
                  messages={[messages.find(m => m.id === activeThread)]}
                  onReaction={handleReaction}
                />
              )}
              
              {/* Thread replies */}
              <ChatMessageList
                messages={threadReplies}
                typingUsers={typingUsers}
                onReaction={handleReaction}
              />
              
              <ChatInput
                onSendMessage={sendThreadReply}
                onTyping={setTyping}
                isConnected={isConnected}
                placeholder="Reply to thread..."
              />
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
} 