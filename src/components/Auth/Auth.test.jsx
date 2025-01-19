import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithTheme } from '../../test/utils'
import { mockSupabase } from '../../test/mocks'
import { AuthProvider } from './AuthProvider'
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

  beforeEach(() => {
    vi.useFakeTimers()
    onSuccess = vi.fn()
    onError = vi.fn()
    mockSupabase.auth.signInWithPassword.mockClear()
    mockSupabase.auth.signUp.mockClear()
    mockSupabase.auth.getSession.mockClear()
    mockSupabase.auth.onAuthStateChange.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('SignIn', () => {
    it('handles successful sign in', async () => {
      const user = userEvent.setup()
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({ data: { user: { id: '123' } }, error: null })

      renderWithProviders(<SignIn onSuccess={onSuccess} />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const signInButton = screen.getByRole('button', { name: /(sign in|signing in)/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(signInButton)

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
      expect(onSuccess).toHaveBeenCalled()
    })

    it('handles sign in errors', async () => {
      const user = userEvent.setup()
      mockSupabase.auth.signInWithPassword.mockRejectedValueOnce(new Error('Invalid credentials'))

      renderWithProviders(<SignIn onError={onError} />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const signInButton = screen.getByRole('button', { name: /(sign in|signing in)/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(signInButton)

      expect(await screen.findByRole('alert')).toHaveTextContent(/invalid credentials/i)
      expect(onError).toHaveBeenCalled()
    })

    it('validates required fields', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SignIn />)

      const signInButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(signInButton)

      const alerts = screen.getAllByRole('alert')
      expect(alerts).toHaveLength(2)
      expect(alerts[0]).toHaveTextContent(/email is required/i)
      expect(alerts[1]).toHaveTextContent(/password is required/i)
    })
  })

  describe('SignUp', () => {
    it('handles successful sign up', async () => {
      const user = userEvent.setup()
      mockSupabase.auth.signUp.mockResolvedValueOnce({ data: { user: { id: '123' } }, error: null })

      renderWithProviders(<SignUp onSuccess={onSuccess} />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      const signUpButton = screen.getByRole('button', { name: /(sign up|creating account)/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      await user.click(signUpButton)

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
      expect(onSuccess).toHaveBeenCalled()
    })

    it('validates password match', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SignUp />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      const signUpButton = screen.getByRole('button', { name: /sign up/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password456')

      await user.click(signUpButton)

      const alerts = screen.getAllByRole('alert')
      const passwordMatchAlert = alerts.find(alert => alert.textContent.match(/passwords do not match/i))
      expect(passwordMatchAlert).toBeInTheDocument()
    })

    it('handles sign up errors', async () => {
      const user = userEvent.setup()
      mockSupabase.auth.signUp.mockRejectedValueOnce(new Error('Email already exists'))

      renderWithProviders(<SignUp onError={onError} />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      const signUpButton = screen.getByRole('button', { name: /sign up/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')

      await user.click(signUpButton)

      await waitFor(() => {
        const alerts = screen.getAllByRole('alert')
        const errorAlert = alerts.find(alert => alert.textContent.match(/email already exists/i))
        expect(errorAlert).toBeInTheDocument()
        expect(onError).toHaveBeenCalled()
      })
    })
  })

  describe('Session Management', () => {
    test('handles session persistence', async () => {
      const mockSession = { access_token: 'token123', user: { id: 'user123' } }
      mockSupabase.auth.getSession.mockResolvedValueOnce({ data: { session: mockSession }, error: null })
      renderWithProviders(<SignIn />)

      vi.runAllTimers()

      await waitFor(() => {
        expect(mockSupabase.auth.getSession).toHaveBeenCalled()
      })
    })

    test('handles sign out', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SignOut onSuccess={onSuccess} />)

      vi.runAllTimers()

      const signOutButton = screen.getByRole('button', { name: /(sign out|signing out)/i })
      await user.click(signOutButton)

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalled()
    })

    test('handles auth state changes', async () => {
      const mockCallback = vi.fn()
      mockSupabase.auth.onAuthStateChange.mockImplementationOnce((callback) => {
        setTimeout(() => {
          callback('SIGNED_IN', { user: { id: 'user123' } })
        }, 100)
        return { unsubscribe: vi.fn() }
      })

      renderWithProviders(<SignIn />)

      vi.runAllTimers()

      await waitFor(() => {
        expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()
      })
    })

    test('cleans up auth subscriptions', async () => {
      const unsubscribe = vi.fn()
      mockSupabase.auth.onAuthStateChange.mockReturnValueOnce({ unsubscribe })

      const { unmount } = renderWithProviders(<SignIn />)

      vi.runAllTimers()
      unmount()

      expect(unsubscribe).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    test('handles network errors', async () => {
      const user = userEvent.setup()
      mockSupabase.auth.signInWithPassword.mockRejectedValueOnce(new Error('Network error'))
      renderWithProviders(<SignIn onError={onError} />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const signInButton = screen.getByRole('button', { name: /(sign in|signing in)/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(signInButton)

      const alerts = await screen.findAllByRole('alert')
      expect(alerts.some(alert => alert.textContent.match(/network error/i))).toBe(true)
      expect(onError).toHaveBeenCalled()
    })

    test('handles rate limiting', async () => {
      const user = userEvent.setup()
      mockSupabase.auth.signInWithPassword.mockRejectedValueOnce(new Error('Too many requests'))
      renderWithProviders(<SignIn onError={onError} />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const signInButton = screen.getByRole('button', { name: /(sign in|signing in)/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(signInButton)

      const alerts = await screen.findAllByRole('alert')
      expect(alerts.some(alert => alert.textContent.match(/too many requests/i))).toBe(true)
      expect(onError).toHaveBeenCalled()
    })

    test('handles invalid tokens', async () => {
      mockSupabase.auth.getSession.mockRejectedValueOnce(new Error('Invalid token'))
      renderWithProviders(<SignIn onError={onError} />)

      vi.runAllTimers()

      await waitFor(() => {
        expect(mockSupabase.auth.getSession).toHaveBeenCalled()
        expect(onError).toHaveBeenCalled()
      })
    })
  })

  describe('Performance', () => {
    it('debounces form submission', async () => {
      const user = userEvent.setup()
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({ data: { user: { id: '123' } }, error: null })

      renderWithProviders(<SignIn onSuccess={onSuccess} />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const signInButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')

      // Simulate rapid clicks
      await user.click(signInButton)
      await user.click(signInButton)
      await user.click(signInButton)

      vi.runAllTimers()

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledTimes(1)
      }, { timeout: 3000 })
    })

    it('cleans up auth subscriptions', async () => {
      const unsubscribe = vi.fn()
      mockSupabase.auth.onAuthStateChange.mockReturnValue(unsubscribe)

      const { unmount } = renderWithProviders(<SignIn />)

      vi.runAllTimers()
      unmount()

      await waitFor(() => {
        expect(unsubscribe).toHaveBeenCalled()
      }, { timeout: 3000 })
    })
  })
}) 