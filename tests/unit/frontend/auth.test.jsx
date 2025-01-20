import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import { AuthProvider } from '../src/contexts/AuthContext'
import Auth from '../src/components/Auth'
import { supabase } from '../src/lib/supabaseClient'
import { act } from 'react-dom/test-utils'

// Mock Supabase auth
vi.mock('../src/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(() => Promise.resolve({
        data: { session: null },
        error: null
      })),
      signUp: vi.fn(() => Promise.resolve({
        data: { session: null },
        error: null
      })),
      signOut: vi.fn(() => Promise.resolve({
        error: null
      })),
      getSession: vi.fn(() => Promise.resolve({
        data: { session: null },
        error: null
      })),
      onAuthStateChange: vi.fn((callback) => {
        // Store callback for later use in tests
        global.authCallback = callback
        return {
          data: { subscription: { unsubscribe: vi.fn() } }
        }
      })
    }
  }
}))

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ChakraProvider>
        <AuthProvider>
          {component}
        </AuthProvider>
      </ChakraProvider>
    </BrowserRouter>
  )
}

describe('Authentication', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await act(async () => {
      await localStorage.clear()
    })
    global.fetch.mockReset()
  })

  it('should show login form by default', async () => {
    await act(async () => {
      renderWithProviders(<Auth />)
    })

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('should handle successful login', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          token: 'test-token',
          user: { id: 1, email: 'test@example.com' }
        })
      })
    )

    await act(async () => {
      renderWithProviders(<Auth />)
    })

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password' }
      })
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /login/i }))
    })

    await waitFor(async () => {
      const token = await localStorage.getItem('auth_token')
      expect(token).toBe('test-token')
    })
  })

  it('should handle login errors', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          error: 'Invalid credentials'
        })
      })
    )

    await act(async () => {
      renderWithProviders(<Auth />)
    })

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'wrong@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpass' }
      })
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /login/i }))
    })

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })

  it('should handle successful signup', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          token: 'test-token',
          user: { id: 2, email: 'new@example.com' }
        })
      })
    )

    await act(async () => {
      renderWithProviders(<Auth />)
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    })

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'new@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'newpass123' }
      })
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    })

    await waitFor(async () => {
      const token = await localStorage.getItem('auth_token')
      expect(token).toBe('test-token')
    })
  })

  it('should handle signup errors', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: 'Email already exists'
        })
      })
    )

    await act(async () => {
      renderWithProviders(<Auth />)
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    })

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'exists@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      })
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    })

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
    })
  })

  it('should handle logout', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    )

    await act(async () => {
      await localStorage.setItem('auth_token', 'test-token')
      await localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com' }))
    })

    await act(async () => {
      renderWithProviders(<Auth />)
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /logout/i }))
    })

    await waitFor(async () => {
      const token = await localStorage.getItem('auth_token')
      expect(token).toBeNull()
    })
  })
}) 