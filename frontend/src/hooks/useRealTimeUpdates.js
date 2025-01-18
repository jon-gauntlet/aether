import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@chakra-ui/react'

const RECONNECT_DELAY = 2000
const MAX_RECONNECT_ATTEMPTS = 5

// Debug logging helper
const debug = (...args) => {
  if (import.meta.env.DEV) {
    console.log('[WebSocket]', ...args)
  }
}

export default function useRealTimeUpdates(url, options = {}) {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [lastMessage, setLastMessage] = useState(null)
  const toast = useToast()

  const connect = useCallback(() => {
    try {
      debug('Connecting to', url)
      const ws = new WebSocket(url)

      ws.onopen = () => {
        debug('Connected successfully')
        setIsConnected(true)
        setReconnectAttempts(0)
        toast({
          title: 'Connected',
          description: 'Connected to real-time updates',
          status: 'success',
          duration: 2000,
          isClosable: true,
        })
      }

      ws.onclose = (event) => {
        debug('Connection closed', event.code, event.reason)
        setIsConnected(false)
        
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const nextAttempt = reconnectAttempts + 1
          const delay = RECONNECT_DELAY * Math.pow(1.5, nextAttempt - 1) // Exponential backoff
          
          debug(`Reconnecting in ${delay}ms (attempt ${nextAttempt}/${MAX_RECONNECT_ATTEMPTS})`)
          setTimeout(() => {
            setReconnectAttempts(nextAttempt)
            connect()
          }, delay)
          
          toast({
            title: 'Connection Lost',
            description: `Reconnecting (attempt ${nextAttempt}/${MAX_RECONNECT_ATTEMPTS})...`,
            status: 'warning',
            duration: 3000,
            isClosable: true,
          })
        } else {
          debug('Max reconnection attempts reached')
          toast({
            title: 'Connection Failed',
            description: 'Failed to reconnect. Please refresh the page.',
            status: 'error',
            duration: null,
            isClosable: true,
          })
        }
      }

      ws.onerror = (error) => {
        debug('WebSocket error:', error)
        toast({
          title: 'Connection Error',
          description: `Error: ${error.message || 'Unknown error'}`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      }

      ws.onmessage = (event) => {
        try {
          debug('Received message:', event.data)
          const data = JSON.parse(event.data)
          setLastMessage(data)
          if (options.onMessage) {
            options.onMessage(data)
          }
        } catch (error) {
          debug('Failed to parse message:', error)
          toast({
            title: 'Message Error',
            description: 'Failed to parse incoming message',
            status: 'error',
            duration: 3000,
            isClosable: true,
          })
        }
      }

      setSocket(ws)
    } catch (error) {
      debug('Failed to connect:', error)
      toast({
        title: 'Connection Error',
        description: `Failed to establish connection: ${error.message}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }, [url, reconnectAttempts, options.onMessage, toast])

  useEffect(() => {
    debug('Initializing WebSocket')
    connect()
    return () => {
      if (socket) {
        debug('Cleaning up WebSocket')
        socket.close()
      }
    }
  }, [connect])

  const sendMessage = useCallback((data) => {
    if (socket?.readyState === WebSocket.OPEN) {
      debug('Sending message:', data)
      socket.send(JSON.stringify(data))
      return true
    }
    debug('Cannot send message - socket not connected')
    toast({
      title: 'Not Connected',
      description: 'Cannot send message while disconnected',
      status: 'error',
      duration: 3000,
      isClosable: true,
    })
    return false
  }, [socket, toast])

  return {
    isConnected,
    lastMessage,
    sendMessage,
    reconnectAttempts
  }
}

// Example usage:
/*
const MyComponent = () => {
  const { isConnected, lastMessage, sendMessage } = useRealTimeUpdates(
    'wss://api.example.com/ws',
    {
      onMessage: (data) => {
        console.log('Received:', data)
      }
    }
  )

  return (
    <div>
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <div>Last message: {JSON.stringify(lastMessage)}</div>
      <button onClick={() => sendMessage({ type: 'ping' })}>
        Send Ping
      </button>
    </div>
  )
}
*/ 