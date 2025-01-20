import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '@chakra-ui/react'

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef(null)
  const toast = useToast()
  const reconnectTimeoutRef = useRef(null)

  const connect = useCallback(() => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.warn('No auth token found')
        return
      }

      const ws = new WebSocket(`${process.env.REACT_APP_WS_URL || 'ws://localhost:8000'}/ws?token=${token}`)
      
      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        // Clear any reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...')
          connect()
        }, 5000)
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to chat server',
          status: 'error',
          duration: 3000,
        })
      }

      wsRef.current = ws
    } catch (err) {
      console.error('Failed to establish WebSocket connection:', err)
      setIsConnected(false)
    }
  }, [toast])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    setIsConnected(false)
  }, [])

  const sendMessage = useCallback((message) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: 'Cannot send message',
        description: 'Not connected to chat server',
        status: 'error',
        duration: 3000,
      })
      return false
    }

    try {
      wsRef.current.send(JSON.stringify(message))
      return true
    } catch (err) {
      console.error('Failed to send message:', err)
      toast({
        title: 'Failed to send message',
        description: err.message,
        status: 'error',
        duration: 3000,
      })
      return false
    }
  }, [toast])

  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    sendMessage,
    connect,
    disconnect
  }
} 