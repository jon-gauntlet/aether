import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import { AuthProvider } from '../src/contexts/AuthContext'
import { Auth } from '../src/components/Auth'
import { supabase } from '../src/lib/supabaseClient'

// Mock Supabase auth
vi.mock('../src/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn()
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
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should show login form by default', () => {
    renderWithProviders(<Auth />)
    expect(screen.getByTestId('auth-form')).toBeInTheDocument()
    expect(screen.getByTestId('email-input')).toBeInTheDocument()
    expect(screen.getByTestId('password-input')).toBeInTheDocument()
  })

  it('should handle successful login', async () => {
    const user = userEvent.setup()
    
    // Mock successful login
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        session: {
          access_token: 'fake-token',
          user: { id: 1, email: 'test@example.com' }
        }
      },
      error: null
    })

    renderWithProviders(<Auth />)

    // Fill in login form
    await user.type(screen.getByTestId('email-input'), 'test@example.com')
    await user.type(screen.getByTestId('password-input'), 'password123')
    await user.click(screen.getByTestId('login-button'))

    // Verify success
    await waitFor(() => {
      expect(localStorage.getItem('auth_token')).toBe('fake-token')
    })
  })

  it('should handle login errors', async () => {
    const user = userEvent.setup()
    
    // Mock login error
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid credentials' }
    })

    renderWithProviders(<Auth />)

    // Fill in login form
    await user.type(screen.getByTestId('email-input'), 'test@example.com')
    await user.type(screen.getByTestId('password-input'), 'wrong')
    await user.click(screen.getByTestId('login-button'))

    // Verify error message
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid credentials')
    })
  })

  it('should handle successful signup', async () => {
    const user = userEvent.setup()
    
    // Mock successful signup
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: {
        session: {
          access_token: 'fake-token',
          user: { id: 1, email: 'new@example.com' }
        }
      },
      error: null
    })

    renderWithProviders(<Auth />)

    // Switch to signup mode
    await user.click(screen.getByTestId('signup-switch'))

    // Fill in signup form
    await user.type(screen.getByTestId('email-input'), 'new@example.com')
    await user.type(screen.getByTestId('password-input'), 'password123')
    await user.click(screen.getByTestId('signup-button'))

    // Verify success
    await waitFor(() => {
      expect(localStorage.getItem('auth_token')).toBe('fake-token')
    })
  })

  it('should handle signup errors', async () => {
    const user = userEvent.setup()
    
    // Mock signup error
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { session: null },
      error: { message: 'Email already exists' }
    })

    renderWithProviders(<Auth />)

    // Switch to signup mode
    await user.click(screen.getByTestId('signup-switch'))

    // Fill in signup form
    await user.type(screen.getByTestId('email-input'), 'exists@example.com')
    await user.type(screen.getByTestId('password-input'), 'password123')
    await user.click(screen.getByTestId('signup-button'))

    // Verify error message
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Email already exists')
    })
  })

  it('should handle logout', async () => {
    const user = userEvent.setup()
    
    // Mock successful logout
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })

    // Set initial auth state
    localStorage.setItem('auth_token', 'fake-token')
    localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com' }))

    renderWithProviders(<Auth />)

    // Click logout button
    await user.click(screen.getByTestId('logout-button'))

    // Verify logged out state
    await waitFor(() => {
      expect(localStorage.getItem('auth_token')).toBeNull()
      expect(screen.getByTestId('auth-form')).toBeInTheDocument()
    })
  })
}) 