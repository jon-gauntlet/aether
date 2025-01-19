import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { Box, VStack, Text, useColorMode } from '@chakra-ui/react'
import ChatInput from './ChatInput'
import ChatMessageList from './ChatMessageList'
import ConnectionStatus from './ConnectionStatus'
import ThreadView from './ThreadView'
import { useRAG } from '../../hooks/useRAG'
import { useAuth } from '../../contexts/AuthContext'

export default function ChatContainer({ spaceType = 'garden' }) {
  const [messagesBySpace, setMessagesBySpace] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [activeThread, setActiveThread] = useState(null)
  const [userReactions, setUserReactions] = useState(new Map())
  const { colorMode } = useColorMode()
  const { user } = useAuth()
  const ws = useRef(null)
  const sentMessages = useRef(new Set())
  
  // RAG integration
  const { query: ragQuery, ingestText, answer: ragAnswer } = useRAG()

  // Get messages for current space
  const messages = useMemo(() => {
    return messagesBySpace[spaceType] || []
  }, [messagesBySpace, spaceType])

  const handleReaction = useCallback((messageId, reaction) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return

    const message = {
      type: 'reaction',
      messageId,
      reaction,
      timestamp: new Date().toISOString(),
      spaceType
    }

    ws.current.send(JSON.stringify(message))

    // Optimistic update
    setUserReactions(prev => {
      const newReactions = new Map(prev)
      const messageReactions = new Set(prev.get(messageId) || [])
      
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
      const spaceMessages = prev[spaceType] || []
      return {
        ...prev,
        [spaceType]: spaceMessages.map(msg => {
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
  }, [spaceType])

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
          const spaceMessages = prev[message.spaceType] || []
          return {
            ...prev,
            [message.spaceType]: spaceMessages.map(msg => {
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
        if (spaceType === 'library' && message.content) {
          await ingestText(message.content, {
            messageId: message.id,
            timestamp: message.timestamp,
            sender: message.sender
          })
        }

        setMessagesBySpace(prev => {
          const spaceMessages = prev[spaceType] || []
          if (message.parent_id) {
            // Handle thread replies
            return {
              ...prev,
              [spaceType]: spaceMessages.map(msg => {
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
            [spaceType]: [...spaceMessages, message]
          }
        })
      }
    }

    ws.current = socket
  }, [retryCount, spaceType, ingestText])

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
    if (spaceType === 'library' && !activeThread) {
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
      spaceType,
      ragContext
    }

    sentMessages.current.add(message.id)
    
    ws.current.send(JSON.stringify(message))
    
    setMessagesBySpace(prev => {
      const spaceMessages = prev[spaceType] || []
      if (activeThread) {
        return {
          ...prev,
          [spaceType]: spaceMessages.map(msg => {
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
        [spaceType]: [...spaceMessages, message]
      }
    })
  }, [activeThread, spaceType, ragQuery, user])

  const handleThreadClick = useCallback((message) => {
    setActiveThread(message)
  }, [])

  const handleCloseThread = useCallback(() => {
    setActiveThread(null)
  }, [])

  return (
    <VStack
      spacing={4}
      h="calc(100vh - 4rem)"
      bg={colorMode === 'light' ? 'white' : 'gray.800'}
      borderRadius="lg"
      shadow="sm"
      p={4}
      data-space={spaceType}
    >
      <ConnectionStatus 
        isConnected={isConnected} 
        error={error}
        retryCount={retryCount}
      />
      <Box flex="1" w="full" overflow="hidden" display="flex" gap={4}>
        <Box flex="1" overflow="hidden">
          <ChatMessageList 
            messages={messages}
            loading={loading}
            sendingMessages={sentMessages.current}
            onReact={handleReaction}
            userReactions={userReactions}
            spaceType={spaceType}
          />
        </Box>
        {activeThread && (
          <Box w="350px" borderLeft="1px" borderColor="gray.200" pl={4}>
            <ThreadView
              parentMessage={activeThread}
              onClose={handleCloseThread}
              spaceType={spaceType}
            />
          </Box>
        )}
      </Box>
      <ChatInput 
        onSendMessage={handleSendMessage}
        disabled={!isConnected}
        placeholder={activeThread ? "Reply in thread..." : "Type a message..."}
      />
    </VStack>
  )
} 