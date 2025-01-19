import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useWebSocket } from '../useWebSocket'
import WebSocketService from '../../services/WebSocketService'

// Mock WebSocketService
vi.mock('../../services/WebSocketService', () => ({
  default: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    send: vi.fn(),
    onMessage: vi.fn(),
    onStatusChange: vi.fn(),
    onTypingChange: vi.fn(),
    sendTypingUpdate: vi.fn(),
    markMessagesAsRead: vi.fn(),
    getMessageReadStatus: vi.fn(),
    getMetrics: vi.fn(),
    resetMetrics: vi.fn()
  }
}))

describe('useWebSocket', () => {
  const url = 'ws://test.com'
  const options = { auth: 'test-token' }

  beforeEach(() => {
    vi.useFakeTimers()
    // Reset all mocks
    vi.clearAllMocks()
    
    // Setup default mock implementations
    WebSocketService.getMetrics.mockReturnValue({
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0
    })

    WebSocketService.onMessage.mockImplementation(cb => {
      return () => {}
    })

    WebSocketService.onStatusChange.mockImplementation(cb => {
      return () => {}
    })

    WebSocketService.onTypingChange.mockImplementation(cb => {
      return () => {}
    })

    WebSocketService.getMessageReadStatus.mockReturnValue(new Set())
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useWebSocket(url, options))

    expect(result.current.connected).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.messages).toEqual([])
    expect(result.current.typingUsers).toEqual([])
    expect(result.current.metrics).toBeDefined()
  })

  it('should connect to WebSocket on mount', () => {
    renderHook(() => useWebSocket(url, options))

    expect(WebSocketService.connect).toHaveBeenCalledWith(url, options)
  })

  it('should handle connection status changes', () => {
    let statusCallback
    WebSocketService.onStatusChange.mockImplementation(cb => {
      statusCallback = cb
      return () => {}
    })

    const { result } = renderHook(() => useWebSocket(url, options))

    act(() => {
      statusCallback(true)
    })
    expect(result.current.connected).toBe(true)
    expect(result.current.error).toBeNull()

    act(() => {
      statusCallback(false)
    })
    expect(result.current.connected).toBe(false)
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('should handle incoming messages', () => {
    let messageCallback
    WebSocketService.onMessage.mockImplementation(cb => {
      messageCallback = cb
      return () => {}
    })

    const { result } = renderHook(() => useWebSocket(url, options))
    const testMessage = { type: 'test', data: 'test data' }

    act(() => {
      messageCallback(testMessage)
    })

    expect(result.current.messages).toEqual([testMessage])
  })

  it('should handle typing updates', () => {
    let typingCallback
    WebSocketService.onTypingChange.mockImplementation(cb => {
      typingCallback = cb
      return () => {}
    })

    const { result } = renderHook(() => useWebSocket(url, options))
    const typingUsers = ['user1', 'user2']

    act(() => {
      typingCallback(typingUsers)
    })

    expect(result.current.typingUsers).toEqual(typingUsers)
  })

  it('should send messages', () => {
    const { result } = renderHook(() => useWebSocket(url, options))
    const message = { type: 'test', data: 'test data' }

    act(() => {
      result.current.send(message)
    })

    expect(WebSocketService.send).toHaveBeenCalledWith(message)
  })

  it('should send typing updates', () => {
    const { result } = renderHook(() => useWebSocket(url, options))

    act(() => {
      result.current.sendTypingUpdate(true)
    })

    expect(WebSocketService.sendTypingUpdate).toHaveBeenCalledWith(true)
  })

  it('should mark messages as read', () => {
    const { result } = renderHook(() => useWebSocket(url, options))
    const messageIds = ['msg1', 'msg2']

    act(() => {
      result.current.markAsRead(messageIds)
    })

    expect(WebSocketService.markMessagesAsRead).toHaveBeenCalledWith(messageIds)
  })

  it('should get message read status', () => {
    const { result } = renderHook(() => useWebSocket(url, options))
    const messageId = 'msg1'
    const readSet = new Set(['user1'])

    WebSocketService.getMessageReadStatus.mockReturnValue(readSet)

    const status = result.current.getReadStatus(messageId)

    expect(WebSocketService.getMessageReadStatus).toHaveBeenCalledWith(messageId)
    expect(status).toBe(readSet)
  })

  it('should clear messages', () => {
    let messageCallback
    WebSocketService.onMessage.mockImplementation(cb => {
      messageCallback = cb
      return () => {}
    })

    const { result } = renderHook(() => useWebSocket(url, options))
    
    act(() => {
      messageCallback({ type: 'test', data: 'test' })
    })
    expect(result.current.messages.length).toBe(1)

    act(() => {
      result.current.clearMessages()
    })
    expect(result.current.messages).toEqual([])
  })

  it('should update metrics periodically', () => {
    const metrics1 = { messagesSent: 1, messagesReceived: 1, errors: 0 }
    const metrics2 = { messagesSent: 2, messagesReceived: 2, errors: 0 }

    WebSocketService.getMetrics
      .mockReturnValueOnce(metrics1)
      .mockReturnValueOnce(metrics2)

    const { result } = renderHook(() => useWebSocket(url, options))

    expect(result.current.metrics).toEqual(metrics1)

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current.metrics).toEqual(metrics2)
  })

  it('should reset metrics', () => {
    const { result } = renderHook(() => useWebSocket(url, options))

    act(() => {
      result.current.resetMetrics()
    })

    expect(WebSocketService.resetMetrics).toHaveBeenCalled()
  })

  it('should clean up on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket(url, options))

    unmount()

    expect(WebSocketService.disconnect).toHaveBeenCalled()
  })

  it('should handle errors when sending messages', () => {
    WebSocketService.send.mockImplementation(() => {
      throw new Error('Send error')
    })

    const { result } = renderHook(() => useWebSocket(url, options))

    act(() => {
      result.current.send({ type: 'test' })
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.connected).toBe(false)
  })

  it('should handle errors when sending typing updates', () => {
    WebSocketService.sendTypingUpdate.mockImplementation(() => {
      throw new Error('Typing error')
    })

    const { result } = renderHook(() => useWebSocket(url, options))

    act(() => {
      result.current.sendTypingUpdate(true)
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.connected).toBe(false)
  })

  it('should handle errors when marking messages as read', () => {
    WebSocketService.markMessagesAsRead.mockImplementation(() => {
      throw new Error('Read error')
    })

    const { result } = renderHook(() => useWebSocket(url, options))

    act(() => {
      result.current.markAsRead(['msg1'])
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.connected).toBe(false)
  })
}) 