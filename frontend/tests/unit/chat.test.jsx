import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChatContainer } from '../../src/components/ChatContainer'
import { AuthProvider } from '../../src/contexts/AuthContext'

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock WebSocket
global.WebSocket = class {
  constructor() {
    setTimeout(() => {
      this.onmessage?.({ data: JSON.stringify({ id: Date.now().toString(), content: 'New message', username: 'test' }) })
    }, 0)
  }
  close() {}
}

describe('ChatContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    localStorage.setItem('auth_token', 'test-token')
  })

  const mockAuthResponse = {
    ok: true,
    json: async () => ({
      user: { email: 'test@example.com' }
    })
  }

  const renderWithAuth = async () => {
    // Mock initial auth check
    mockFetch.mockResolvedValueOnce(mockAuthResponse)

    const result = render(
      <AuthProvider>
        <ChatContainer />
      </AuthProvider>
    )

    // Wait for auth check to complete
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/me', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      })
    })

    return result
  }

  it('should load messages on mount', async () => {
    mockFetch
      .mockResolvedValueOnce(mockAuthResponse)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([{ id: 'msg1', content: 'Test message', username: 'test' }])
      })

    await renderWithAuth()

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/messages/general', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      })
      expect(screen.getByText('Test message')).toBeInTheDocument()
    })
  })

  it('should send message and update UI', async () => {
    mockFetch
      .mockResolvedValueOnce(mockAuthResponse)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      })
      .mockResolvedValueOnce({
        ok: true
      })

    await renderWithAuth()

    const input = screen.getByTestId('message-input')
    const button = screen.getByTestId('send-button')

    fireEvent.change(input, { target: { value: 'New message' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          content: 'New message',
          channel: 'general',
          username: 'test@example.com'
        })
      })
    })
  })

  it('should handle channel switching', async () => {
    mockFetch
      .mockResolvedValueOnce(mockAuthResponse)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([{ id: 'msg3', content: 'Random message', username: 'test' }])
      })

    await renderWithAuth()

    const select = screen.getByTestId('channel-select')
    fireEvent.change(select, { target: { value: 'random' } })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/messages/random', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      })
      expect(screen.getByText('Random message')).toBeInTheDocument()
    })
  })

  it('should handle real-time updates', async () => {
    mockFetch
      .mockResolvedValueOnce(mockAuthResponse)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      })

    await renderWithAuth()

    await waitFor(() => {
      expect(screen.getByText('New message')).toBeInTheDocument()
    })
  })

  it('should handle errors when loading messages', async () => {
    mockFetch
      .mockResolvedValueOnce(mockAuthResponse)
      .mockRejectedValueOnce(new Error('Failed to load messages'))

    await renderWithAuth()

    await waitFor(() => {
      expect(screen.getByText('Failed to load messages')).toBeInTheDocument()
    })
  })

  it('should handle errors when sending messages', async () => {
    mockFetch
      .mockResolvedValueOnce(mockAuthResponse)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      })
      .mockRejectedValueOnce(new Error('Failed to send message'))

    await renderWithAuth()

    const input = screen.getByTestId('message-input')
    const button = screen.getByTestId('send-button')

    fireEvent.change(input, { target: { value: 'New message' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Failed to send message')).toBeInTheDocument()
    })
  })
}) 