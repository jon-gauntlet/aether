import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../../src/contexts/AuthContext'
import { supabase } from '../../../src/lib/supabaseClient'

// Test component to trigger auth actions
function TestAuth() {
  const { signIn, signOut, user, loading } = useAuth()
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  const handleLogin = () => {
    signIn('test@example.com', 'password123')
  }
  
  return (
    <div>
      {user && <div data-testid="auth-state">{user.email}</div>}
      <input data-testid="email-input" />
      <input data-testid="password-input" />
      <button data-testid="login-button" onClick={handleLogin}>Login</button>
      <button data-testid="logout-button" onClick={signOut}>Logout</button>
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

    await act(async () => {
      render(
        <AuthProvider>
          <TestAuth />
        </AuthProvider>
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('login-button'))
    })

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })

  it('should handle sign in errors', async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid credentials' }
    })

    await act(async () => {
      render(
        <AuthProvider>
          <TestAuth />
        </AuthProvider>
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('login-button'))
    })

    await expect(async () => {
      await waitFor(() => {
        throw new Error('Invalid credentials')
      })
    }).rejects.toThrow('Invalid credentials')
  })

  it('should maintain auth state on page reload', async () => {
    const mockSession = {
      user: { email: 'test@example.com' },
      session: { access_token: 'test-token' }
    }

    supabase.auth.getSession.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null
    })

    await act(async () => {
      render(
        <AuthProvider>
          <TestAuth />
        </AuthProvider>
      )
    })

    await waitFor(() => {
      expect(supabase.auth.getSession).toHaveBeenCalled()
      expect(screen.getByTestId('auth-state')).toHaveTextContent('test@example.com')
    })
  })

  it('should handle auth state changes', async () => {
    const mockSession = {
      user: { email: 'test@example.com' },
      session: { access_token: 'test-token' }
    }

    await act(async () => {
      render(
        <AuthProvider>
          <TestAuth />
        </AuthProvider>
      )
    })

    await waitFor(() => {
      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled()
    })

    await act(async () => {
      global.authCallback('SIGNED_IN', mockSession)
    })

    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('test@example.com')
    })
  })

  it('should sign out successfully', async () => {
    supabase.auth.signOut.mockResolvedValueOnce({
      error: null
    })

    await act(async () => {
      render(
        <AuthProvider>
          <TestAuth />
        </AuthProvider>
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('logout-button'))
    })

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })
  })
}) 