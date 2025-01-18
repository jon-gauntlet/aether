import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider } from '../../src/contexts/AuthContext'
import { ChatContainer } from '../../src/components/ChatContainer'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Session Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    localStorage.clear()
  })

  it('should require authentication to view chat', async () => {
    render(
      <AuthProvider>
        <ChatContainer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/please log in/i)).toBeInTheDocument()
    })
  })

  it('should persist session across page reloads', async () => {
    localStorage.setItem('auth_token', 'test-token')
    
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { email: 'test@example.com' } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      })

    render(
      <AuthProvider>
        <ChatContainer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/me', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      })
      expect(screen.getByTestId('chat-container')).toBeInTheDocument()
    })
  })

  it('should clear session on logout', async () => {
    localStorage.setItem('auth_token', 'test-token')
    
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { email: 'test@example.com' } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      })

    render(
      <AuthProvider>
        <ChatContainer />
      </AuthProvider>
    )

    const logoutButton = await screen.findByTestId('logout-button')
    fireEvent.click(logoutButton)

    await waitFor(() => {
      expect(localStorage.getItem('auth_token')).toBeNull()
      expect(screen.getByText(/please log in/i)).toBeInTheDocument()
    })
  })

  it('should handle expired sessions', async () => {
    localStorage.setItem('auth_token', 'expired-token')
    
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Token expired' })
      })

    render(
      <AuthProvider>
        <ChatContainer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(localStorage.getItem('auth_token')).toBeNull()
      expect(screen.getByText(/please log in/i)).toBeInTheDocument()
    })
  })
}) 