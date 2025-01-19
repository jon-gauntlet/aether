import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { Auth } from '../../src/components/auth/Auth'
import { AuthProvider } from '../../src/contexts/AuthContext'

vi.mock('../../src/lib/supabaseClient', () => {
  return {
    supabase: {
      auth: {
        signInWithPassword: vi.fn(async ({ email, password }) => {
          await new Promise(resolve => setTimeout(resolve, 100))
          if (email === 'test@example.com' && password === 'password') {
            return {
              data: {
                user: { email: 'test@example.com' },
                session: { access_token: 'test-token' }
              },
              error: null
            }
          }
          return {
            data: null,
            error: { message: 'Invalid credentials' }
          }
        }),
        signOut: vi.fn(async () => {
          return { error: null }
        }),
        getSession: vi.fn(async () => {
          return {
            data: {
              session: null
            },
            error: null
          }
        }),
        onAuthStateChange: vi.fn((callback) => {
          callback('SIGNED_IN', {
            user: { email: 'test@example.com' },
            session: { access_token: 'test-token' }
          })
          return { data: { subscription: { unsubscribe: vi.fn() } } }
        })
      }
    }
  }
})

describe('Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders login form', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <Auth />
        </AuthProvider>
      )
    })

    expect(screen.getByTestId('email-input')).toBeInTheDocument()
    expect(screen.getByTestId('password-input')).toBeInTheDocument()
    expect(screen.getByTestId('login-button')).toBeInTheDocument()
  })

  it('handles successful login', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <Auth />
        </AuthProvider>
      )
    })

    await act(async () => {
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'password' }
      })
      fireEvent.click(screen.getByTestId('login-button'))
    })

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  it('handles failed login', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <Auth />
        </AuthProvider>
      )
    })

    await act(async () => {
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'wrong@example.com' }
      })
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'wrongpass' }
      })
      fireEvent.click(screen.getByTestId('login-button'))
    })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials')
    })
  })

  it('validates required fields', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <Auth />
        </AuthProvider>
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('login-button'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('email-input')).toBeInvalid()
      expect(screen.getByTestId('password-input')).toBeInvalid()
    })
  })

  it('disables form during submission', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <Auth />
        </AuthProvider>
      )
    })

    let submitPromise
    await act(async () => {
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'password' }
      })
      submitPromise = fireEvent.click(screen.getByTestId('login-button'))
    })

    expect(screen.getByTestId('email-input')).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByTestId('password-input')).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByTestId('login-button')).toHaveAttribute('aria-disabled', 'true')

    await submitPromise
  })
}) 