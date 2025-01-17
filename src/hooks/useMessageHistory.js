import { useState, useCallback } from 'react'
import { showToast } from '../ui/components/ToastContainer'

export default function useMessageHistory() {
  const [messages, setMessages] = useState([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

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
      showToast({
        message: data.error || 'An error occurred',
        type: 'error'
      })
    } else if (data.type === 'typing') {
      // Handle typing indicator
    }
  }, [addMessage])

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
      setHasMore(false) // For demo, disable after first load
    } catch (error) {
      showToast({
        message: 'Failed to load message history',
        type: 'error'
      })
    } finally {
      setIsLoadingHistory(false)
    }
  }, [isLoadingHistory, hasMore])

  return {
    messages,
    addMessage,
    handleRealTimeMessage,
    loadMoreMessages,
    isLoadingHistory,
    hasMore
  }
} 