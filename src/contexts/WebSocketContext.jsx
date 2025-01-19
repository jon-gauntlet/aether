import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

const WebSocketContext = createContext(null)

const MAX_RECONNECT_ATTEMPTS = 3
const RECONNECT_DELAY = 1000 // 1 second

export function WebSocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const reconnectAttemptsRef = useRef(0)
  const urlRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  const connect = useCallback((wsUrl) => {
    if (socket) {
      socket.close()
    }

    urlRef.current = wsUrl
    setError(null)
    
    try {
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        setConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }

      ws.onclose = () => {
        setConnected(false)
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1
            connect(urlRef.current)
          }, RECONNECT_DELAY)
        }
      }

      ws.onerror = (event) => {
        setError('Connection failed')
        setConnected(false)
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1
            connect(urlRef.current)
          }, RECONNECT_DELAY)
        }
      }

      ws.onmessage = (event) => {
        setMessages(prev => [...prev, event.data])
      }

      setSocket(ws)
    } catch (err) {
      setError(err.message)
      setConnected(false)
    }
  }, [socket])

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close()
      setSocket(null)
      setConnected(false)
      setMessages([])
      setError(null)
      reconnectAttemptsRef.current = 0
      urlRef.current = null
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [socket])

  const send = useCallback((message) => {
    if (socket && connected) {
      socket.send(message)
    } else {
      setError('Not connected')
    }
  }, [socket, connected])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [socket])

  // Reconnect on mount if URL exists
  useEffect(() => {
    if (urlRef.current && !socket && !connected) {
      connect(urlRef.current)
    }
  }, [connect, socket, connected])

  const value = {
    connect,
    disconnect,
    send,
    connected,
    messages,
    error
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
} 