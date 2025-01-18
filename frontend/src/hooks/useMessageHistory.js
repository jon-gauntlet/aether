import { useState, useCallback } from 'react'
import { useToast } from '@chakra-ui/react'

export default function useMessageHistory() {
  const [messages, setMessages] = useState([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const toast = useToast()

  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...message
    }])
  }, [])

  const handleRealTimeMessage = useCallback((data) => {
    if (data.type === 'message') {
      addMessage({
        content: data.content,
        role: 'assistant',
      })
    } else if (data.type === 'error') {
      toast({
        title: 'Error',
        description: data.error || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } else if (data.type === 'typing') {
      // Handle typing indicator
    }
  }, [addMessage, toast])

  const loadMoreMessages = useCallback(async () => {
    if (isLoadingHistory || !hasMore) return

    try {
      setIsLoadingHistory(true)
      // Simulate loading more messages
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const olderMessages = [
        // Simulated older messages
        {
          id: Date.now() - 1000,
          content: "This is an older message",
          role: "assistant",
          timestamp: new Date(Date.now() - 1000).toISOString()
        }
      ]

      setMessages(prev => [...olderMessages, ...prev])
      setHasMore(false) // No more messages to load
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load message history',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoadingHistory(false)
    }
  }, [isLoadingHistory, hasMore, toast])

  return {
    messages,
    hasMore,
    isLoadingHistory,
    addMessage,
    handleRealTimeMessage,
    loadMoreMessages
  }
} 