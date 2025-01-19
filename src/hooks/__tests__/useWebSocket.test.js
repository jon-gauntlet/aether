import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import useWebSocket from '../useWebSocket'
import WebSocketService from '../../services/WebSocketService'

// Mock WebSocketService
vi.mock('../../services/WebSocketService')

describe('useWebSocket', () => {
  let mockOnMessage
  let mockOnStatusChange
  let mockConnect
  let mockSend
  let mockDisconnect

  beforeEach(() => {
    mockOnMessage = vi.fn()
    mockOnStatusChange = vi.fn()
    mockConnect = vi.fn()
    mockSend = vi.fn()
    mockDisconnect = vi.fn()

    // Reset mock implementation
    WebSocketService.mockImplementation(() => ({
      onMessage: mockOnMessage.mockReturnValue(() => {}),
      onStatusChange: mockOnStatusChange.mockReturnValue(() => {}),
      connect: mockConnect.mockResolvedValue(undefined),
      send: mockSend,
      disconnect: mockDisconnect
    }))
  })

  it('should connect to WebSocket when URL is provided', async () => {
    const url = 'ws://localhost:8000'
    renderHook(() => useWebSocket(url))

    expect(mockConnect).toHaveBeenCalledWith(url)
  })

  it('should not connect when URL is not provided', () => {
    renderHook(() => useWebSocket())
    expect(mockConnect).not.toHaveBeenCalled()
  })

  it('should subscribe to messages and status changes', () => {
    renderHook(() => useWebSocket('ws://localhost:8000'))
    
    expect(mockOnMessage).toHaveBeenCalled()
    expect(mockOnStatusChange).toHaveBeenCalled()
  })

  it('should update connection status', async () => {
    let statusCallback
    mockOnStatusChange.mockImplementation(callback => {
      statusCallback = callback
      return () => {}
    })

    const { result } = renderHook(() => useWebSocket('ws://localhost:8000'))
    
    expect(result.current.isConnected).toBe(false)

    // Simulate connection status change
    act(() => {
      statusCallback(true)
    })

    expect(result.current.isConnected).toBe(true)
  })

  it('should update last message when receiving messages', () => {
    let messageCallback
    mockOnMessage.mockImplementation(callback => {
      messageCallback = callback
      return () => {}
    })

    const { result } = renderHook(() => useWebSocket('ws://localhost:8000'))
    
    expect(result.current.lastMessage).toBe(null)

    const testMessage = { type: 'test', data: 'hello' }
    
    // Simulate message reception
    act(() => {
      messageCallback(testMessage)
    })

    expect(result.current.lastMessage).toEqual(testMessage)
  })

  it('should send messages', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8000'))
    
    const message = { type: 'test', data: 'hello' }
    act(() => {
      result.current.sendMessage(message)
    })

    expect(mockSend).toHaveBeenCalledWith(message)
  })

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket('ws://localhost:8000'))
    
    unmount()
    
    expect(mockDisconnect).toHaveBeenCalled()
  })
}) 