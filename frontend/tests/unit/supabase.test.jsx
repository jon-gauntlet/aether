import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../src/contexts/AuthContext'
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

// Test component to trigger auth actions
function TestAuth() {
  const { login, logout } = useAuth()
  
  const handleLogin = () => {
    login({ email: 'test@example.com', password: 'password123' })
  }
  
  return (
    <div>
      <input data-testid="email-input" />
      <input data-testid="password-input" />
      <button data-testid="login-button" onClick={handleLogin}>Login</button>
      <button data-testid="logout-button" onClick={logout}>Logout</button>
    </div>
  )
}

describe('Supabase Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should sign in with email and password', async () => {
    const mockSession = {
      user: { email: 'test@example.com' },
      session: { access_token: 'test-token' }
    }

    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: mockSession,
      error: null
    })

    render(
      <AuthProvider>
        <TestAuth />
      </AuthProvider>
    )

    fireEvent.click(screen.getByTestId('login-button'))

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
      expect(localStorage.getItem('auth_token')).toBe('test-token')
    })
  })

  it('should handle sign in errors', async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid credentials' }
    })

    render(
      <AuthProvider>
        <TestAuth />
      </AuthProvider>
    )

    fireEvent.click(screen.getByTestId('login-button'))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      expect(localStorage.getItem('auth_token')).toBeNull()
    })
  })

  it('should maintain auth state on page reload', async () => {
    const mockSession = {
      user: { email: 'test@example.com' },
      access_token: 'test-token'
    }

    localStorage.setItem('auth_token', 'test-token')
    
    supabase.auth.getSession.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null
    })

    render(
      <AuthProvider>
        <div data-testid="auth-state" />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(supabase.auth.getSession).toHaveBeenCalled()
      expect(localStorage.getItem('auth_token')).toBe('test-token')
    })
  })

  it('should handle auth state changes', async () => {
    const mockSession = {
      user: { email: 'test@example.com' },
      access_token: 'test-token'
    }

    let authCallback
    supabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authCallback = callback
      return {
        data: { subscription: { unsubscribe: vi.fn() } }
      }
    })

    render(
      <AuthProvider>
        <div data-testid="auth-state" />
      </AuthProvider>
    )

    // Simulate auth state change
    authCallback('SIGNED_IN', mockSession)

    await waitFor(() => {
      expect(localStorage.getItem('auth_token')).toBe('test-token')
    })
  })

  it('should sign out successfully', async () => {
    supabase.auth.signOut.mockResolvedValueOnce({
      error: null
    })

    render(
      <AuthProvider>
        <TestAuth />
      </AuthProvider>
    )

    fireEvent.click(screen.getByTestId('logout-button'))

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled()
      expect(localStorage.getItem('auth_token')).toBeNull()
    })
  })
}) 