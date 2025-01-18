import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderWithAuth } from '../utils/test-utils'
import { ChatContainer } from '../../src/components/ChatContainer'
import { act } from '@testing-library/react'

describe('API Performance', () => {
  let startTime
  const mockFetch = vi.fn()
  global.fetch = mockFetch

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    localStorage.setItem('auth_token', 'test-token')
    startTime = performance.now()
  })

  it('should load messages from API within 200ms', async () => {
    // Mock auth response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { email: 'test@example.com' } })
    })

    // Mock messages response with 100 messages
    const messages = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      content: `Test message ${i}`,
      username: 'test'
    }))

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => messages
    })

    await act(async () => {
      await renderWithAuth(<ChatContainer />)
    })
    const endTime = performance.now()
    const apiTime = endTime - startTime

    expect(apiTime).toBeLessThan(200)
  })

  it('should send message to API within 100ms', async () => {
    // Mock auth response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { email: 'test@example.com' } })
    })

    // Mock initial messages load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    })

    let component
    await act(async () => {
      component = await renderWithAuth(<ChatContainer />)
    })

    // Reset mock and timer for send message test
    mockFetch.mockReset()
    mockFetch.mockResolvedValueOnce({ ok: true })
    startTime = performance.now()

    // Send a message
    const input = await component.findByTestId('message-input')
    const button = await component.findByTestId('send-button')
    
    await act(async () => {
      input.value = 'Test message'
      await button.click()
    })

    const endTime = performance.now()
    const sendTime = endTime - startTime

    expect(sendTime).toBeLessThan(100)
  })

  it('should handle WebSocket messages within 50ms', async () => {
    // Mock auth response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { email: 'test@example.com' } })
    })

    // Mock initial messages load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    })

    let component
    await act(async () => {
      component = await renderWithAuth(<ChatContainer />)
    })

    // Test WebSocket message handling
    startTime = performance.now()
    const message = { id: 'test', content: 'Test message', username: 'test' }
    
    await act(async () => {
      // The WebSocket mock in setup.js will automatically trigger onmessage
      // with a new message after a setTimeout(0)
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    await component.findByText('New message')
    const endTime = performance.now()
    const wsTime = endTime - startTime

    expect(wsTime).toBeLessThan(50)
  })
}) 