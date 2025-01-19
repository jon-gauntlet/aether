import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { Auth } from '../../src/components/auth/Auth'
import { AuthProvider } from '../../src/contexts/AuthContext'
import { ChatContainer } from '../../src/components/chat/ChatContainer'
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

    // Mock initial session check
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })
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

    await act(async () => {
      render(
        <AuthProvider>
          <Auth />
          <ChatContainer />
        </AuthProvider>
      )
    })

    // Perform login
    const emailInput = screen.getByTestId('email-input')
    const passwordInput = screen.getByTestId('password-input')
    const loginButton = screen.getByTestId('login-button')

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password' } })
      fireEvent.click(loginButton)
    })

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

    await act(async () => {
      render(
        <AuthProvider>
          <Auth />
        </AuthProvider>
      )
    })

    // Perform login
    const emailInput = screen.getByTestId('email-input')
    const passwordInput = screen.getByTestId('password-input')
    const loginButton = screen.getByTestId('login-button')

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrong-password' } })
      fireEvent.click(loginButton)
    })

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

    await act(async () => {
      render(
        <AuthProvider>
          <Auth />
        </AuthProvider>
      )
    })

    // Perform login
    const emailInput = screen.getByTestId('email-input')
    const passwordInput = screen.getByTestId('password-input')
    const loginButton = screen.getByTestId('login-button')

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password' } })
      fireEvent.click(loginButton)
    })

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
    supabase.auth.getSession.mockResolvedValueOnce({
      data: { 
        session: { 
          user: { email: 'test@example.com' },
          access_token: 'fake-token'
        } 
      },
      error: null
    })

    await act(async () => {
      render(
        <AuthProvider>
          <ChatContainer />
        </AuthProvider>
      )
    })

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    // Perform logout
    const logoutButton = screen.getByTestId('logout-button')
    await act(async () => {
      fireEvent.click(logoutButton)
    })

    // Verify auth state is cleared
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled()
      expect(localStorage.getItem('auth_token')).toBeNull()
      expect(screen.getByText('Please log in to access the chat.')).toBeInTheDocument()
    })
  })
}) 