import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { Box, VStack, Text, useColorMode, Button, Select, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, useDisclosure } from '@chakra-ui/react'
import ChatInput from './ChatInput'
import ChatMessageList from './ChatMessageList'
import ConnectionStatus from './ConnectionStatus'
import ThreadView from './ThreadView'
import { FileUpload } from '../FileUpload'
import { useRAG } from '../../hooks/useRAG'
import { useAuth } from '../../contexts/AuthContext'

export default function ChatContainer() {
  const { user, logout } = useAuth()
  const { isOpen, onOpen, onClose } = useDisclosure()

  if (!user) {
    return (
      <Box p={4}>
        <Text>Please log in to access the chat.</Text>
      </Box>
    )
  }

  const [messagesBySpace, setMessagesBySpace] = useState({ general: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [activeThread, setActiveThread] = useState(null)
  const [userReactions, setUserReactions] = useState(new Map())
  const { colorMode } = useColorMode()
  const ws = useRef(null)
  const sentMessages = useRef(new Set())
  
  // RAG integration
  const { query: ragQuery, ingestText, answer: ragAnswer } = useRAG()

  // Get messages for current space
  const messages = useMemo(() => {
    return messagesBySpace['general'] || []
  }, [messagesBySpace])

  const handleReaction = useCallback((messageId, reaction) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return

    const message = {
      type: 'reaction',
      messageId,
      reaction,
      timestamp: new Date().toISOString(),
      spaceType: 'general'
    }

    ws.current.send(JSON.stringify(message))

    // Optimistic update
    setUserReactions(prev => {
      const newReactions = new Map(prev)
      const messageReactions = new Set(newReactions.get(messageId) || [])
      
      if (messageReactions.has(reaction)) {
        messageReactions.delete(reaction)
      } else {
        messageReactions.add(reaction)
      }
      
      if (messageReactions.size > 0) {
        newReactions.set(messageId, messageReactions)
      } else {
        newReactions.delete(messageId)
      }
      
      return newReactions
    })

    setMessagesBySpace(prev => {
      const spaceMessages = prev.general || []
      return {
        ...prev,
        general: spaceMessages.map(msg => {
          if (msg.id === messageId) {
            const reactions = { ...(msg.reactions || {}) }
            if (reactions[reaction]) {
              reactions[reaction]--
              if (reactions[reaction] <= 0) {
                delete reactions[reaction]
              }
            } else {
              reactions[reaction] = (reactions[reaction] || 0) + 1
            }
            return { ...msg, reactions }
          }
          return msg
        })
      }
    })
  }, [])

  const connectWebSocket = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return

    const token = localStorage.getItem('auth_token')
    const socket = new WebSocket(`${import.meta.env.VITE_WS_URL}?token=${token}`)

    socket.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
      setRetryCount(0)
      setError(null)
      setLoading(false)
    }

    socket.onclose = () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
      setLoading(true)
      setError('Connection lost. Retrying...')
      const timeout = Math.min(1000 * Math.pow(2, retryCount), 30000)
      setTimeout(() => {
        setRetryCount(prev => prev + 1)
        connectWebSocket()
      }, timeout)
    }

    socket.onerror = (error) => {
      console.error('WebSocket error:', error)
      setError('Connection error')
    }

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data)
      
      if (message.type === 'reaction') {
        setMessagesBySpace(prev => {
          const spaceMessages = prev.general || []
          return {
            ...prev,
            general: spaceMessages.map(msg => {
              if (msg.id === message.messageId) {
                const reactions = { ...(msg.reactions || {}) }
                if (message.add) {
                  reactions[message.reaction] = (reactions[message.reaction] || 0) + 1
                } else {
                  reactions[message.reaction]--
                  if (reactions[message.reaction] <= 0) {
                    delete reactions[message.reaction]
                  }
                }
                return { ...msg, reactions }
              }
              return msg
            })
          }
        })
        return
      }

      if (!sentMessages.current.has(message.id)) {
        // Add message to RAG context if in library space
        if ('general' === 'library' && message.content) {
          await ingestText(message.content, {
            messageId: message.id,
            timestamp: message.timestamp,
            sender: message.sender
          })
        }

        setMessagesBySpace(prev => {
          const spaceMessages = prev.general || []
          if (message.parent_id) {
            // Handle thread replies
            return {
              ...prev,
              general: spaceMessages.map(msg => {
                if (msg.id === message.parent_id) {
                  return {
                    ...msg,
                    replies: [...(msg.replies || []), message]
                  }
                }
                return msg
              })
            }
          }
          return {
            ...prev,
            general: [...spaceMessages, message]
          }
        })
      }
    }

    ws.current = socket
  }, [retryCount, ingestText])

  useEffect(() => {
    if (user) {
      connectWebSocket()
    }
    return () => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.close()
      }
    }
  }, [connectWebSocket, user])

  const handleSendMessage = useCallback(async (content) => {
    if (!content.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return

    // If in library space, query RAG for context
    let ragContext = null
    if ('general' === 'library' && !activeThread) {
      try {
        const result = await ragQuery(content)
        ragContext = result
      } catch (err) {
        console.error('RAG query failed:', err)
      }
    }

    const message = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      sender: user.email,
      parent_id: activeThread?.id,
      spaceType: 'general',
      ragContext
    }

    sentMessages.current.add(message.id)
    
    ws.current.send(JSON.stringify(message))
    
    setMessagesBySpace(prev => {
      const spaceMessages = prev['general'] || []
      if (activeThread) {
        return {
          ...prev,
          general: spaceMessages.map(msg => {
            if (msg.id === activeThread.id) {
              return {
                ...msg,
                replies: [...(msg.replies || []), message]
              }
            }
            return msg
          })
        }
      }
      return {
        ...prev,
        general: [...spaceMessages, message]
      }
    })
  }, [activeThread, 'general', ragQuery, user])

  const handleThreadClick = useCallback((message) => {
    setActiveThread(message)
  }, [])

  const handleCloseThread = useCallback(() => {
    setActiveThread(null)
  }, [])

  return (
    <Box h="100vh" display="flex" flexDirection="column">
      <Box p={4} borderBottom="1px" borderColor="gray.200">
        <Button onClick={logout} size="sm" colorScheme="red">
          Logout
        </Button>
        <Button ml={2} onClick={onOpen} size="sm" colorScheme="blue">
          Files
        </Button>
      </Box>

      <Box flex="1" overflow="hidden">
        {activeThread ? (
          <ThreadView
            thread={activeThread}
            onClose={() => setActiveThread(null)}
            onSendMessage={handleSendMessage}
            userReactions={userReactions}
            onReaction={handleReaction}
          />
        ) : (
          <VStack h="100%" spacing={0}>
            <ConnectionStatus isConnected={isConnected} error={error} />
            <ChatMessageList
              messages={messages}
              onThreadClick={setActiveThread}
              userReactions={userReactions}
              onReaction={handleReaction}
            />
            <ChatInput onSendMessage={handleSendMessage} isDisabled={!isConnected} />
          </VStack>
        )}
      </Box>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Chat Files</DrawerHeader>
          <DrawerBody>
            <FileUpload />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  )
} 