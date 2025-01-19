import { useState, useEffect, useCallback, useRef } from 'react'
import WebSocketService from '../services/WebSocketService'

export const useWebSocket = (url, options = {}) => {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)
  const [messages, setMessages] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const [metrics, setMetrics] = useState(WebSocketService.getMetrics())
  const metricsInterval = useRef(null)

  const handleMessage = useCallback((message) => {
    setMessages(prev => [...prev, message])
  }, [])

  const handleStatusChange = useCallback((status) => {
    setConnected(status)
    if (!status) {
      setError(new Error('WebSocket disconnected'))
    } else {
      setError(null)
    }
  }, [])

  const handleTypingChange = useCallback((users) => {
    setTypingUsers(users)
  }, [])

  const handleError = useCallback((err) => {
    setError(err)
    setConnected(false)
  }, [])

  const updateMetrics = useCallback(() => {
    setMetrics(WebSocketService.getMetrics())
  }, [])

  useEffect(() => {
    try {
      WebSocketService.connect(url, options)
      
      const messageUnsub = WebSocketService.onMessage(handleMessage)
      const statusUnsub = WebSocketService.onStatusChange(handleStatusChange)
      const typingUnsub = WebSocketService.onTypingChange(handleTypingChange)

      metricsInterval.current = setInterval(updateMetrics, 5000)

      return () => {
        messageUnsub()
        statusUnsub()
        typingUnsub()
        if (metricsInterval.current) {
          clearInterval(metricsInterval.current)
        }
        WebSocketService.disconnect()
      }
    } catch (err) {
      handleError(err)
    }
  }, [url, options, handleMessage, handleStatusChange, handleTypingChange, handleError, updateMetrics])

  const send = useCallback((message) => {
    try {
      WebSocketService.send(message)
    } catch (err) {
      handleError(err)
    }
  }, [handleError])

  const sendTypingUpdate = useCallback((isTyping) => {
    try {
      WebSocketService.sendTypingUpdate(isTyping)
    } catch (err) {
      handleError(err)
    }
  }, [handleError])

  const markAsRead = useCallback((messageIds) => {
    try {
      WebSocketService.markMessagesAsRead(messageIds)
    } catch (err) {
      handleError(err)
    }
  }, [handleError])

  const getReadStatus = useCallback((messageId) => {
    return WebSocketService.getMessageReadStatus(messageId)
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  const resetMetrics = useCallback(() => {
    WebSocketService.resetMetrics()
    updateMetrics()
  }, [updateMetrics])

  return {
    connected,
    error,
    messages,
    typingUsers,
    metrics,
    send,
    sendTypingUpdate,
    markAsRead,
    getReadStatus,
    clearMessages,
    resetMetrics
  }
}

export default useWebSocket 