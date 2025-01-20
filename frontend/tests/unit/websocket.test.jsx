import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WebSocketProvider, useWebSocket } from '../../../src/contexts/WebSocketContext'

// Test component to trigger WebSocket actions
function TestWebSocket() {
  const { 
    connect, 
    disconnect, 
    send, 
    connected, 
    messages, 
    error 
  } = useWebSocket()

  return (
    <div>
      <div data-testid="connection-status">
        {connected ? 'Connected' : 'Disconnected'}
      </div>
      {error && (
        <div data-testid="error-message">{error}</div>
      )}
      <div data-testid="messages">
        {messages.map((msg, i) => (
          <div key={i} data-testid="message">{msg}</div>
        ))}
      </div>
      <button 
        data-testid="connect-button" 
        onClick={() => connect('ws://localhost:8000')}
      >
        Connect
      </button>
      <button 
        data-testid="disconnect-button" 
        onClick={disconnect}
      >
        Disconnect
      </button>
      <button 
        data-testid="send-button" 
        onClick={() => send('test message')}
      >
        Send
      </button>
    </div>
  )
}

describe('WebSocket', () => {
  let mockWebSocket
  let onOpenCallback
  let onCloseCallback
  let onErrorCallback
  let onMessageCallback

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockWebSocket = class extends WebSocket {
      constructor(url) {
        super(url)
        this.url = url
        this.readyState = WebSocket.CONNECTING
      }

      set onopen(callback) {
        onOpenCallback = callback
        // Auto trigger onopen in next tick
        setTimeout(() => {
          this.readyState = WebSocket.OPEN
          callback && callback()
        }, 0)
      }

      set onclose(callback) {
        onCloseCallback = callback
      }

      set onerror(callback) {
        onErrorCallback = callback
      }

      set onmessage(callback) {
        onMessageCallback = callback
      }

      close() {
        this.readyState = WebSocket.CLOSED
        onCloseCallback && onCloseCallback()
      }

      send(data) {
        if (this.readyState === WebSocket.OPEN) {
          onMessageCallback && onMessageCallback({ data })
        }
      }
    }

    global.WebSocket = mockWebSocket
  })

  it('should connect successfully', async () => {
    render(
      <WebSocketProvider>
        <TestWebSocket />
      </WebSocketProvider>
    )

    fireEvent.click(screen.getByTestId('connect-button'))

    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected')
    })
  })

  it('should disconnect successfully', async () => {
    render(
      <WebSocketProvider>
        <TestWebSocket />
      </WebSocketProvider>
    )

    fireEvent.click(screen.getByTestId('connect-button'))
    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected')
    })

    fireEvent.click(screen.getByTestId('disconnect-button'))
    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected')
    })
  })

  it('should send and receive messages', async () => {
    render(
      <WebSocketProvider>
        <TestWebSocket />
      </WebSocketProvider>
    )

    fireEvent.click(screen.getByTestId('connect-button'))
    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected')
    })

    fireEvent.click(screen.getByTestId('send-button'))
    await waitFor(() => {
      expect(screen.getByTestId('message')).toHaveTextContent('test message')
    })
  })

  it('should handle connection errors', async () => {
    mockWebSocket = class extends WebSocket {
      constructor(url) {
        super(url)
        this.readyState = WebSocket.CONNECTING
        // Don't auto-connect in this test
        onOpenCallback = null
      }

      set onopen(callback) {
        // Don't auto-connect
      }

      set onclose(callback) {
        onCloseCallback = callback
        // Trigger error and close immediately
        setTimeout(() => {
          this.readyState = WebSocket.CLOSED
          onErrorCallback && onErrorCallback(new Error('Connection failed'))
          callback && callback()
        }, 0)
      }
    }
    global.WebSocket = mockWebSocket

    render(
      <WebSocketProvider>
        <TestWebSocket />
      </WebSocketProvider>
    )

    fireEvent.click(screen.getByTestId('connect-button'))

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Connection failed')
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected')
    })
  })

  it('should handle reconnection on error', async () => {
    let connectionAttempts = 0
    mockWebSocket = class extends WebSocket {
      constructor(url) {
        super(url)
        this.readyState = WebSocket.CONNECTING
        connectionAttempts++
      }

      set onopen(callback) {
        onOpenCallback = callback
        if (connectionAttempts === 2) {
          setTimeout(() => {
            this.readyState = WebSocket.OPEN
            callback && callback()
          }, 0)
        }
      }

      set onclose(callback) {
        onCloseCallback = callback
        if (connectionAttempts === 1) {
          setTimeout(() => {
            this.readyState = WebSocket.CLOSED
            onErrorCallback && onErrorCallback(new Error('Connection failed'))
            callback && callback()
          }, 0)
        }
      }
    }
    global.WebSocket = mockWebSocket

    render(
      <WebSocketProvider>
        <TestWebSocket />
      </WebSocketProvider>
    )

    fireEvent.click(screen.getByTestId('connect-button'))

    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected')
      expect(connectionAttempts).toBe(2)
    }, { timeout: 3000 })
  })

  it('should maintain connection state across component re-renders', async () => {
    const { rerender } = render(
      <WebSocketProvider>
        <TestWebSocket />
      </WebSocketProvider>
    )

    fireEvent.click(screen.getByTestId('connect-button'))
    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected')
    })

    // Re-render component
    rerender(
      <WebSocketProvider>
        <TestWebSocket />
      </WebSocketProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected')
    })
  })
}) 