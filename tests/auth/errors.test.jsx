import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import { AuthProvider } from '../../src/contexts/AuthContext'
import { Auth } from '../../src/components/Auth'
import { supabase } from '../../src/lib/supabaseClient'
import { act } from 'react-dom/test-utils'

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

describe('Authentication Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    global.fetch.mockReset()
  })

  it('should handle invalid credentials error from REST API', async () => {
    const user = userEvent.setup()
    
    // Mock login error via REST API
    global.fetch.mockImplementationOnce((url) => {
      if (url === '/api/auth/login') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({
            error: 'Invalid email or password'
          })
        })
      }
    })

    // Mock Supabase error as fallback
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' }
    })

    renderWithProviders(<Auth />)

    await act(async () => {
      await user.type(screen.getByTestId('email-input'), 'wrong@example.com')
      await user.type(screen.getByTestId('password-input'), 'wrongpass')
      await user.click(screen.getByTestId('login-button'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid email or password')
    })
  })

  it('should handle network error during login', async () => {
    const user = userEvent.setup()
    
    // Mock network error via REST API
    global.fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')))

    // Mock Supabase error as fallback
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: null,
      error: { message: 'Network error' }
    })

    renderWithProviders(<Auth />)

    await act(async () => {
      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('password-input'), 'password123')
      await user.click(screen.getByTestId('login-button'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Network error')
    })
  })

  it('should handle existing email error during signup', async () => {
    const user = userEvent.setup()
    
    // Mock signup error via REST API
    global.fetch.mockImplementationOnce((url) => {
      if (url === '/api/auth/signup') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({
            error: 'Email already exists'
          })
        })
      }
    })

    // Mock Supabase error as fallback
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: null,
      error: { message: 'Email already exists' }
    })

    renderWithProviders(<Auth />)

    await act(async () => {
      await user.click(screen.getByTestId('signup-switch'))
      await user.type(screen.getByTestId('email-input'), 'exists@example.com')
      await user.type(screen.getByTestId('password-input'), 'password123')
      await user.click(screen.getByTestId('signup-button'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Email already exists')
    })
  })

  it('should handle invalid email format', async () => {
    const user = userEvent.setup()
    
    // Mock signup error via REST API
    global.fetch.mockImplementationOnce((url) => {
      if (url === '/api/auth/signup') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({
            error: 'Invalid email format'
          })
        })
      }
    })

    renderWithProviders(<Auth />)

    await act(async () => {
      await user.click(screen.getByTestId('signup-switch'))
      await user.type(screen.getByTestId('email-input'), 'invalid-email')
      await user.type(screen.getByTestId('password-input'), 'password123')
      await user.click(screen.getByTestId('signup-button'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid email format')
    })
  })

  it('should handle password too short error', async () => {
    const user = userEvent.setup()
    
    // Mock signup error via REST API
    global.fetch.mockImplementationOnce((url) => {
      if (url === '/api/auth/signup') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({
            error: 'Password must be at least 6 characters'
          })
        })
      }
    })

    renderWithProviders(<Auth />)

    await act(async () => {
      await user.click(screen.getByTestId('signup-switch'))
      await user.type(screen.getByTestId('email-input'), 'new@example.com')
      await user.type(screen.getByTestId('password-input'), '12345')
      await user.click(screen.getByTestId('signup-button'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Password must be at least 6 characters')
    })
  })
}) 