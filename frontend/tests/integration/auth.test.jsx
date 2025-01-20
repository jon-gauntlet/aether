import React from 'react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
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
      refreshSession: vi.fn(),
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
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('redirects to chat after successful login', async () => {
    const mockSession = {
      user: { email: 'test@example.com' },
      access_token: 'fake-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    }

    // Mock Supabase auth
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null
    })

    // Mock session refresh
    supabase.auth.refreshSession.mockResolvedValueOnce({
      data: { session: { ...mockSession, expires_at: mockSession.expires_at + 3600 } },
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
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const loginButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password' } })
    fireEvent.click(loginButton)

    // Verify auth state and API calls
    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      })
      expect(screen.getByTestId('channel-select')).toBeInTheDocument()
    })

    // Fast forward to near token expiry
    vi.advanceTimersByTime(3500 * 1000) // 58.33 minutes

    // Verify token refresh
    await waitFor(() => {
      expect(supabase.auth.refreshSession).toHaveBeenCalled()
    })
  })

  it('persists auth state across page reloads', async () => {
    const mockSession = {
      user: { email: 'test@example.com' },
      access_token: 'fake-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600
    }

    // Mock Supabase session check
    supabase.auth.getSession.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null
    })

    // Mock session refresh
    supabase.auth.refreshSession.mockResolvedValueOnce({
      data: { session: { ...mockSession, expires_at: mockSession.expires_at + 3600 } },
      error: null
    })

    render(
      <AuthProvider sessionPersistence={true}>
        <ChatContainer />
      </AuthProvider>
    )

    // Verify auth state persists
    await waitFor(() => {
      expect(supabase.auth.getSession).toHaveBeenCalled()
    })

    // Fast forward to near token expiry
    vi.advanceTimersByTime(3500 * 1000) // 58.33 minutes

    // Verify token refresh
    await waitFor(() => {
      expect(supabase.auth.refreshSession).toHaveBeenCalled()
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
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const loginButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrong-password' } })
    fireEvent.click(loginButton)

    // Verify error is shown
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials')
    })

    // Verify error clears on input change
    fireEvent.change(passwordInput, { target: { value: 'new-password' } })
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
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
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const loginButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password' } })
    fireEvent.click(loginButton)

    // Verify error is shown with user-friendly message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to connect. Please check your internet connection.')
    })
  })

  it('cleans up subscriptions and timers on unmount', async () => {
    const mockSession = {
      user: { email: 'test@example.com' },
      access_token: 'fake-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600
    }

    const unsubscribe = vi.fn()
    supabase.auth.onAuthStateChange.mockReturnValueOnce({
      data: { subscription: { unsubscribe } }
    })

    supabase.auth.getSession.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null
    })

    const { unmount } = render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    )

    // Wait for initial setup
    await waitFor(() => {
      expect(supabase.auth.getSession).toHaveBeenCalled()
    })

    // Unmount component
    unmount()

    // Verify cleanup
    expect(unsubscribe).toHaveBeenCalled()
  })

  it('debounces multiple sign in attempts', async () => {
    const mockSession = {
      user: { email: 'test@example.com' },
      access_token: 'fake-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600
    }

    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null
    })

    render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    )

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const loginButton = screen.getByRole('button', { name: /sign in/i })

    // Fill form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password' } })

    // Click multiple times rapidly
    fireEvent.click(loginButton)
    fireEvent.click(loginButton)
    fireEvent.click(loginButton)

    // Wait for debounce
    vi.advanceTimersByTime(400)

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledTimes(1)
    })
  })
}) 