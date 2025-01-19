import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import { AuthProvider } from '../../src/contexts/AuthContext'
import { Auth } from '../../src/components/Auth'
import { supabase } from '../../src/lib/supabaseClient'
import { act } from 'react'

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

describe('Authentication Logout', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await act(async () => {
      await localStorage.clear()
    })
    global.fetch.mockReset()
  })

  it('should handle successful logout via REST API', async () => {
    const user = userEvent.setup()
    
    // Set initial auth state
    await act(async () => {
      await localStorage.setItem('auth_token', 'test-token')
      await localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com' }))
    })

    // Mock successful logout via REST API
    global.fetch.mockImplementationOnce((url) => {
      if (url === '/api/auth/logout') {
        return Promise.resolve({ 
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
      }
    })

    // Mock initial session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token',
          user: { id: 1, email: 'test@example.com' }
        }
      },
      error: null
    })

    let rendered
    await act(async () => {
      rendered = renderWithProviders(<Auth />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('logout-button')).toBeInTheDocument()
    })

    await act(async () => {
      await user.click(screen.getByTestId('logout-button'))
    })

    await waitFor(async () => {
      const token = await localStorage.getItem('auth_token')
      const userStr = await localStorage.getItem('user')
      expect(token).toBeNull()
      expect(userStr).toBeNull()
      expect(screen.getByTestId('login-button')).toBeInTheDocument()
    })

    rendered.unmount()
  })

  it('should handle REST API logout failure with Supabase fallback', async () => {
    const user = userEvent.setup()
    let rendered
    
    // Set initial auth state
    await act(async () => {
      await localStorage.setItem('auth_token', 'test-token')
      await localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com' }))
    })

    // Mock failed logout via REST API
    global.fetch.mockImplementationOnce((url) => {
      if (url === '/api/auth/logout') {
        return Promise.resolve({ 
          ok: false,
          json: () => Promise.resolve({ error: 'Logout failed' })
        })
      }
    })

    // Mock successful Supabase logout
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })

    // Mock initial session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token',
          user: { id: 1, email: 'test@example.com' }
        }
      },
      error: null
    })

    await act(async () => {
      rendered = renderWithProviders(<Auth />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('logout-button')).toBeInTheDocument()
    })

    await act(async () => {
      await user.click(screen.getByTestId('logout-button'))
    })

    await waitFor(async () => {
      const token = await localStorage.getItem('auth_token')
      const userStr = await localStorage.getItem('user')
      expect(token).toBeNull()
      expect(userStr).toBeNull()
      expect(screen.getByTestId('login-button')).toBeInTheDocument()
    })

    rendered.unmount()
  })

  it('should handle both REST API and Supabase logout failures', async () => {
    const user = userEvent.setup()
    let rendered
    
    // Set initial auth state
    await act(async () => {
      await localStorage.setItem('auth_token', 'test-token')
      await localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com' }))
    })

    // Mock failed logout via REST API
    global.fetch.mockImplementationOnce((url) => {
      if (url === '/api/auth/logout') {
        return Promise.resolve({ 
          ok: false,
          json: () => Promise.resolve({ error: 'Logout failed' })
        })
      }
    })

    // Mock failed Supabase logout
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ 
      error: { message: 'Logout failed' }
    })

    // Mock initial session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token',
          user: { id: 1, email: 'test@example.com' }
        }
      },
      error: null
    })

    await act(async () => {
      rendered = renderWithProviders(<Auth />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('logout-button')).toBeInTheDocument()
    })

    await act(async () => {
      await user.click(screen.getByTestId('logout-button'))
    })

    await waitFor(async () => {
      const token = await localStorage.getItem('auth_token')
      const userStr = await localStorage.getItem('user')
      expect(token).toBeNull()
      expect(userStr).toBeNull()
      expect(screen.getByTestId('login-button')).toBeInTheDocument()
      expect(screen.getByTestId('error-message')).toHaveTextContent('Error logging out')
    })

    rendered.unmount()
  })

  it('should handle network error during logout', async () => {
    const user = userEvent.setup()
    let rendered
    
    // Set initial auth state
    await act(async () => {
      await localStorage.setItem('auth_token', 'test-token')
      await localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com' }))
    })

    // Mock network error via REST API
    global.fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')))

    // Mock failed Supabase logout
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ 
      error: { message: 'Network error' }
    })

    // Mock initial session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token',
          user: { id: 1, email: 'test@example.com' }
        }
      },
      error: null
    })

    await act(async () => {
      rendered = renderWithProviders(<Auth />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('logout-button')).toBeInTheDocument()
    })

    await act(async () => {
      await user.click(screen.getByTestId('logout-button'))
    })

    await waitFor(async () => {
      const token = await localStorage.getItem('auth_token')
      const userStr = await localStorage.getItem('user')
      expect(token).toBeNull()
      expect(userStr).toBeNull()
      expect(screen.getByTestId('login-button')).toBeInTheDocument()
      expect(screen.getByTestId('error-message')).toHaveTextContent('Network error')
    })

    rendered.unmount()
  })
}) 