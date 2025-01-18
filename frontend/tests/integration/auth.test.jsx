import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Auth } from '../../src/components/Auth'
import { AuthProvider } from '../../src/contexts/AuthContext'
import { ChatContainer } from '../../src/components/ChatContainer'
import { supabase } from '../../src/lib/supabaseClient'

// Mock Supabase client
vi.mock('../../src/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    }
  }
}))

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Auth Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    localStorage.clear()
  })

  it('redirects to chat after successful login', async () => {
    const mockSession = {
      user: { email: 'test@example.com' },
      session: { access_token: 'fake-token' }
    }

    // Mock Supabase auth
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: mockSession,
      error: null
    })

    // Mock messages API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([])
    })

    render(
      <AuthProvider>
        <Auth />
        <ChatContainer />
      </AuthProvider>
    )

    // Perform login
    const emailInput = screen.getByTestId('email-input')
    const passwordInput = screen.getByTestId('password-input')
    const loginButton = screen.getByTestId('login-button')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password' } })
    fireEvent.click(loginButton)

    // Verify auth state and API calls
    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      })
      expect(localStorage.getItem('auth_token')).toBe('fake-token')
      expect(mockFetch).toHaveBeenCalledWith('/api/messages/general', {
        headers: {
          'Authorization': 'Bearer fake-token'
        }
      })
      expect(screen.getByTestId('channel-select')).toBeInTheDocument()
    })
  })

  it('persists auth state across page reloads', async () => {
    const mockSession = {
      user: { email: 'test@example.com' },
      access_token: 'fake-token'
    }

    // Set auth token in localStorage
    localStorage.setItem('auth_token', 'fake-token')

    // Mock Supabase session check
    supabase.auth.getSession.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null
    })

    // Mock messages API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([])
    })

    render(
      <AuthProvider>
        <ChatContainer />
      </AuthProvider>
    )

    // Verify auth state persists
    await waitFor(() => {
      expect(supabase.auth.getSession).toHaveBeenCalled()
      expect(localStorage.getItem('auth_token')).toBe('fake-token')
      expect(mockFetch).toHaveBeenCalledWith('/api/messages/general', {
        headers: {
          'Authorization': 'Bearer fake-token'
        }
      })
    })
  })

  it('handles auth errors and shows error message', async () => {
    // Mock auth error
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid credentials' }
    })

    render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    )

    // Perform login
    const emailInput = screen.getByTestId('email-input')
    const passwordInput = screen.getByTestId('password-input')
    const loginButton = screen.getByTestId('login-button')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrong-password' } })
    fireEvent.click(loginButton)

    // Verify error is shown
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      expect(localStorage.getItem('auth_token')).toBeNull()
    })
  })

  it('handles network errors during auth', async () => {
    // Mock network error
    supabase.auth.signInWithPassword.mockRejectedValueOnce(
      new Error('Network error')
    )

    render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    )

    // Perform login
    const emailInput = screen.getByTestId('email-input')
    const passwordInput = screen.getByTestId('password-input')
    const loginButton = screen.getByTestId('login-button')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password' } })
    fireEvent.click(loginButton)

    // Verify error is shown
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
      expect(localStorage.getItem('auth_token')).toBeNull()
    })
  })

  it('clears auth state on logout', async () => {
    // Mock successful logout
    supabase.auth.signOut.mockResolvedValueOnce({
      error: null
    })

    // Set initial auth state
    localStorage.setItem('auth_token', 'fake-token')

    render(
      <AuthProvider>
        <ChatContainer />
      </AuthProvider>
    )

    // Perform logout
    const logoutButton = screen.getByTestId('logout-button')
    fireEvent.click(logoutButton)

    // Verify auth state is cleared
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled()
      expect(localStorage.getItem('auth_token')).toBeNull()
      expect(screen.getByText('Please log in to access the chat.')).toBeInTheDocument()
    })
  })
}) 