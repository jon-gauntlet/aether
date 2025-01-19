import { useState, useEffect, useCallback } from 'react'
import WebSocketService from '../services/WebSocketService'

const webSocketService = new WebSocketService()

export const useWebSocket = (url) => {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const [activeUsers, setActiveUsers] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const [messageDelivery, setMessageDelivery] = useState(new Map())
  const [readReceipts, setReadReceipts] = useState({
    readMessages: new Map(),
    unreadMessages: new Set()
  })

  useEffect(() => {
    if (!url) return

    const connect = async () => {
      try {
        await webSocketService.connect(url)
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error)
      }
    }

    const handleMessage = (message) => {
      setLastMessage(message)
    }

    const handleStatus = (status) => {
      setIsConnected(status)
    }

    const handlePresence = (users) => {
      setActiveUsers(users)
    }

    const handleTyping = (users) => {
      setTypingUsers(users)
    }

    const handleDelivery = (deliveryInfo) => {
      setMessageDelivery(prev => {
        const next = new Map(prev)
        next.set(deliveryInfo.messageId, {
          status: deliveryInfo.status,
          deliveryTime: deliveryInfo.deliveryTime,
          timestamp: Date.now()
        })
        // Keep only last 100 delivery receipts
        if (next.size > 100) {
          const oldest = Math.min(...next.keys())
          next.delete(oldest)
        }
        return next
      })
    }

    const handleReadReceipt = (readState) => {
      setReadReceipts({
        readMessages: new Map(readState.readMessages),
        unreadMessages: new Set(readState.unreadMessages)
      })
    }

    // Subscribe to WebSocket events
    const unsubscribeMessage = webSocketService.onMessage(handleMessage)
    const unsubscribeStatus = webSocketService.onStatusChange(handleStatus)
    const unsubscribePresence = webSocketService.onPresenceChange(handlePresence)
    const unsubscribeTyping = webSocketService.onTypingChange(handleTyping)
    const unsubscribeDelivery = webSocketService.onDelivery(handleDelivery)
    const unsubscribeRead = webSocketService.onReadReceipt(handleReadReceipt)

    connect()

    return () => {
      unsubscribeMessage()
      unsubscribeStatus()
      unsubscribePresence()
      unsubscribeTyping()
      unsubscribeDelivery()
      unsubscribeRead()
      webSocketService.disconnect()
    }
  }, [url])

  const sendMessage = useCallback((message) => {
    try {
      webSocketService.send(message)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }, [])

  const sendTypingUpdate = useCallback((isTyping) => {
    try {
      webSocketService.sendTypingUpdate(isTyping)
    } catch (error) {
      console.error('Failed to send typing update:', error)
    }
  }, [])

  const getMessageDeliveryStatus = useCallback((messageId) => {
    return messageDelivery.get(messageId)
  }, [messageDelivery])

  const markMessagesAsRead = useCallback((messageIds) => {
    try {
      webSocketService.markMessagesAsRead(messageIds)
    } catch (error) {
      console.error('Failed to mark messages as read:', error)
    }
  }, [])

  const getMessageReadStatus = useCallback((messageId) => {
    return webSocketService.getMessageReadStatus(messageId)
  }, [])

  return {
    isConnected,
    lastMessage,
    sendMessage,
    activeUsers,
    typingUsers,
    sendTypingUpdate,
    getMessageDeliveryStatus,
    messageDelivery,
    markMessagesAsRead,
    getMessageReadStatus,
    readReceipts
  }
}

export default useWebSocket 