import React from 'react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithTheme } from '../../test/utils'
import { mockSupabase } from '../../test/mocks'
import { AuthProvider, useAuth } from './AuthProvider'
import SignIn from './SignIn'
import SignUp from './SignUp'
import SignOut from './SignOut'
import { ThemeContext } from 'styled-components'
import { renderWithProviders } from '../../test/utils'

// Mock theme hook
const mockTheme = {
  colors: {
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      700: '#15803d',
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      700: '#b91c1c',
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      700: '#b45309',
    },
    background: '#ffffff',
    text: '#0f172a',
  },
  typography: {
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  },
  transitions: {
    base: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
}

vi.mock('../../theme/ThemeProvider', () => ({
  useTheme: () => ({
    theme: mockTheme,
    isDark: false,
    toggleTheme: vi.fn(),
  }),
  ThemeProvider: ({ children }) => (
    <ThemeContext.Provider value={mockTheme}>
      {children}
    </ThemeContext.Provider>
  ),
}))

describe('Authentication', () => {
  let onSuccess
  let onError
  let unsubscribe
  let mockClient

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    onSuccess = vi.fn()
    onError = vi.fn()
    unsubscribe = vi.fn()
    
    // Create a single mock client instance
    mockClient = {
      auth: {
        ...mockSupabase.auth,
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn(),
        onAuthStateChange: vi.fn()
      }
    }

    // Setup default mock implementations
    mockClient.auth.signInWithPassword.mockImplementation(mockSupabase.auth.signInWithPassword)
    mockClient.auth.signUp.mockImplementation(mockSupabase.auth.signUp)
    mockClient.auth.signOut.mockImplementation(mockSupabase.auth.signOut)
    mockClient.auth.getSession.mockImplementation(mockSupabase.auth.getSession)
    mockClient.auth.onAuthStateChange.mockImplementation((callback) => {
      const subscription = { unsubscribe }
      callback('SIGNED_IN', { user: { id: '123' } })
      return { data: { subscription } }
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    unsubscribe.mockClear()
  })

  const renderWithAuth = (component) => {
    return renderWithProviders(
      <AuthProvider supabase={mockClient}>
        {component}
      </AuthProvider>
    )
  }

  describe('SignIn', () => {
    it('handles successful sign in', async () => {
      const user = userEvent.setup({ delay: null })
      mockClient.auth.signInWithPassword.mockResolvedValueOnce({ data: { user: { id: '123' } }, error: null })

      renderWithAuth(<SignIn onSuccess={onSuccess} />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const signInButton = screen.getByRole('button', { name: /(sign in|signing in)/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(signInButton)

      await waitFor(() => {
        expect(mockClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        })
      })
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('handles sign in errors', async () => {
      const user = userEvent.setup({ delay: null })
      mockClient.auth.signInWithPassword.mockRejectedValueOnce(new Error('Invalid credentials'))

      renderWithAuth(<SignIn onError={onError} />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const signInButton = screen.getByRole('button', { name: /(sign in|signing in)/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(signInButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/invalid credentials/i)
      })
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalled()
      })
    })

    it('validates required fields', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithAuth(<SignIn />)

      const signInButton = screen.getByRole('button', { name: /(sign in|signing in)/i })
      await user.click(signInButton)

      await waitFor(() => {
        const alerts = screen.getAllByRole('alert')
        expect(alerts).toHaveLength(2)
        expect(alerts[0]).toHaveTextContent(/email is required/i)
        expect(alerts[1]).toHaveTextContent(/password is required/i)
      })
    })
  })

  describe('SignUp', () => {
    it('handles successful sign up', async () => {
      const user = userEvent.setup({ delay: null })
      mockClient.auth.signUp.mockResolvedValueOnce({ data: { user: { id: '123' } }, error: null })

      renderWithAuth(<SignUp onSuccess={onSuccess} />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      const signUpButton = screen.getByRole('button', { name: /(sign up|creating account)/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'Password123!')
      await user.type(confirmPasswordInput, 'Password123!')
      await user.click(signUpButton)

      await waitFor(() => {
        expect(mockClient.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'Password123!'
        })
      })
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('validates password match', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithAuth(<SignUp />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      const signUpButton = screen.getByRole('button', { name: /(sign up|creating account)/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'Password123!')
      await user.type(confirmPasswordInput, 'Password456!')

      await user.click(signUpButton)

      await waitFor(() => {
        const alerts = screen.getAllByRole('alert')
        const passwordMatchAlert = alerts.find(alert => alert.textContent.match(/passwords do not match/i))
        expect(passwordMatchAlert).toBeInTheDocument()
      })
    })

    it('handles sign up errors', async () => {
      const user = userEvent.setup({ delay: null })
      mockClient.auth.signUp.mockRejectedValueOnce(new Error('Email taken'))

      renderWithAuth(<SignUp onError={onError} />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      const signUpButton = screen.getByRole('button', { name: /(sign up|creating account)/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'Password123!')
      await user.type(confirmPasswordInput, 'Password123!')
      await user.click(signUpButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('This email is already registered')
      })
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalled()
      })
    })
  })

  describe('Session Management', () => {
    it('handles session persistence', async () => {
      mockClient.auth.getSession.mockResolvedValueOnce({ 
        data: { session: { user: { id: '123' } } }, 
        error: null 
      })

      const { unmount } = renderWithAuth(<AuthProvider>
        <div>Authenticated Content</div>
      </AuthProvider>)

      await waitFor(() => {
        expect(mockClient.auth.getSession).toHaveBeenCalled()
      })

      unmount()
    }, { timeout: 10000 })

    it('handles sign out', async () => {
      const user = userEvent.setup({ delay: null })
      mockClient.auth.signOut.mockResolvedValueOnce({ error: null })

      const { unmount } = renderWithAuth(<SignOut onSuccess={onSuccess} />)

      const signOutButton = screen.getByRole('button', { name: /(sign out|signing out)/i })
      await user.click(signOutButton)

      await waitFor(() => {
        expect(mockClient.auth.signOut).toHaveBeenCalled()
      })
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })

      unmount()
    }, { timeout: 10000 })

    it('handles auth state changes', async () => {
      const authStateChange = vi.fn()
      mockClient.auth.getSession.mockResolvedValueOnce({ 
        data: { session: null }, 
        error: null 
      })

      const { unmount } = renderWithAuth(
        <AuthProvider onAuthStateChange={authStateChange}>
          <div>Content</div>
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockClient.auth.onAuthStateChange).toHaveBeenCalled()
      })

      unmount()
    }, { timeout: 10000 })

    it('cleans up auth subscriptions', async () => {
      mockClient.auth.getSession.mockResolvedValueOnce({ 
        data: { session: null }, 
        error: null 
      })

      const { unmount } = renderWithAuth(
        <AuthProvider>
          <div>Content</div>
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockClient.auth.onAuthStateChange).toHaveBeenCalled()
      })

      unmount()

      await waitFor(() => {
        expect(unsubscribe).toHaveBeenCalled()
      })
    }, { timeout: 10000 })
  })

  describe('Error Handling', () => {
    it('handles network errors', async () => {
      const user = userEvent.setup({ delay: null })
      mockClient.auth.signInWithPassword.mockRejectedValueOnce(new Error('Network error'))

      renderWithAuth(<SignIn onError={onError} />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const signInButton = screen.getByRole('button', { name: /(sign in|signing in)/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(signInButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/unable to connect/i)
      })
    }, { timeout: 10000 })

    it('handles rate limiting', async () => {
      const user = userEvent.setup({ delay: null })
      mockClient.auth.signInWithPassword.mockRejectedValueOnce(new Error('Too many requests'))

      renderWithAuth(<SignIn onError={onError} />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const signInButton = screen.getByRole('button', { name: /(sign in|signing in)/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(signInButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/too many attempts/i)
      })
    }, { timeout: 10000 })

    it('handles invalid tokens', async () => {
      const error = new Error('Invalid refresh token')
      const onErrorCallback = vi.fn()

      // Mock getSession to reject immediately
      mockClient.auth.getSession.mockImplementation(() => {
        return Promise.reject(error)
      })

      // Mock onAuthStateChange to do nothing
      mockClient.auth.onAuthStateChange.mockImplementation(() => {
        return { data: { subscription: { unsubscribe } } }
      })

      // Create a test component that uses useAuth
      const TestComponent = () => {
        const { error: authError } = useAuth()
        return <div data-testid="error-display">{authError}</div>
      }

      const { unmount } = renderWithProviders(
        <AuthProvider supabase={mockClient} onError={onErrorCallback}>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for the error state to be set
      await waitFor(() => {
        expect(screen.getByTestId('error-display')).toHaveTextContent(error.message)
      })

      unmount()
    })
  })

  describe('Performance', () => {
    it('debounces form submission', async () => {
      const user = userEvent.setup({ delay: null })
      mockClient.auth.signInWithPassword.mockResolvedValueOnce({ data: { user: { id: '123' } }, error: null })

      renderWithAuth(<SignIn onSuccess={onSuccess} />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const signInButton = screen.getByRole('button', { name: /(sign in|signing in)/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')

      // Rapid clicks
      await user.click(signInButton)
      await user.click(signInButton)
      await user.click(signInButton)

      await waitFor(() => {
        expect(mockClient.auth.signInWithPassword).toHaveBeenCalledTimes(1)
      })
    }, { timeout: 10000 })

    it('cleans up auth subscriptions', async () => {
      mockClient.auth.getSession.mockResolvedValueOnce({ 
        data: { session: null }, 
        error: null 
      })

      const { unmount } = renderWithAuth(
        <AuthProvider>
          <div>Content</div>
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockClient.auth.onAuthStateChange).toHaveBeenCalled()
      })

      unmount()

      await waitFor(() => {
        expect(unsubscribe).toHaveBeenCalled()
      })
    }, { timeout: 10000 })
  })
}) 