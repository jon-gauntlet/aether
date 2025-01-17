import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import useRealTimeUpdates from '../useRealTimeUpdates'

describe('useRealTimeUpdates', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    global.WebSocket = vi.fn(() => ({
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      close: vi.fn()
    }))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('establishes connection on mount', () => {
    renderHook(() => useRealTimeUpdates())
    expect(WebSocket).toHaveBeenCalledTimes(1)
  })

  it('handles successful connection', () => {
    const { result } = renderHook(() => useRealTimeUpdates())
    const ws = WebSocket.mock.results[0].value

    act(() => {
      ws.onopen?.()
    })

    expect(result.current.isConnected).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('handles connection error', () => {
    const { result } = renderHook(() => useRealTimeUpdates())
    const ws = WebSocket.mock.results[0].value

    act(() => {
      ws.onerror?.(new Error('Connection failed'))
    })

    expect(result.current.isConnected).toBe(false)
    expect(result.current.error).toBeTruthy()
  })

  it('attempts reconnection on close', async () => {
    const { result } = renderHook(() => useRealTimeUpdates())
    const ws = WebSocket.mock.results[0].value

    act(() => {
      ws.onclose?.()
    })

    expect(result.current.isConnected).toBe(false)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })

    expect(WebSocket).toHaveBeenCalledTimes(2)
  })

  it('handles message sending', () => {
    const { result } = renderHook(() => useRealTimeUpdates())
    const ws = WebSocket.mock.results[0].value
    ws.send = vi.fn()

    act(() => {
      ws.onopen?.()
      result.current.sendMessage('test message')
    })

    expect(ws.send).toHaveBeenCalledWith('test message')
  })

  it('processes received messages', () => {
    const onMessage = vi.fn()
    const { result } = renderHook(() => useRealTimeUpdates({ onMessage }))
    const ws = WebSocket.mock.results[0].value

    const testMessage = { data: 'test message' }
    act(() => {
      ws.onmessage?.(testMessage)
    })

    expect(onMessage).toHaveBeenCalledWith(testMessage.data)
  })

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useRealTimeUpdates())
    const ws = WebSocket.mock.results[0].value

    unmount()
    expect(ws.close).toHaveBeenCalled()
  })
}) 