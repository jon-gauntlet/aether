import { useState, useEffect, useCallback } from 'react'
import { showToast } from '../ui/components/ToastContainer'

const RECONNECT_DELAY = 2000
const MAX_RECONNECT_ATTEMPTS = 5

export default function useRealTimeUpdates(url, options = {}) {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [lastMessage, setLastMessage] = useState(null)

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url)

      ws.onopen = () => {
        setIsConnected(true)
        setReconnectAttempts(0)
        showToast({ 
          message: 'Connected to real-time updates', 
          type: 'success',
          duration: 2000
        })
      }

      ws.onclose = () => {
        setIsConnected(false)
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1)
            connect()
          }, RECONNECT_DELAY)
        } else {
          showToast({
            message: 'Failed to reconnect. Please refresh the page.',
            type: 'error',
            duration: 0 // Persist until manually closed
          })
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        showToast({
          message: 'Connection error. Attempting to reconnect...',
          type: 'warning'
        })
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage(data)
          options.onMessage?.(data)
        } catch (error) {
          console.error('Failed to parse message:', error)
        }
      }

      setSocket(ws)

      return () => {
        ws.close()
      }
    } catch (error) {
      console.error('Failed to connect:', error)
      showToast({
        message: 'Failed to establish connection',
        type: 'error'
      })
    }
  }, [url, reconnectAttempts, options.onMessage])

  useEffect(() => {
    const cleanup = connect()
    return () => cleanup?.()
  }, [connect])

  const sendMessage = useCallback((data) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data))
      return true
    }
    return false
  }, [socket])

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