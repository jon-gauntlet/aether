import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { BrowserRouter } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import Auth from '../../src/components/Auth'

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ChakraProvider>
        {component}
      </ChakraProvider>
    </BrowserRouter>
  )
}

describe('Authentication Token Management', () => {
  beforeEach(async () => {
    await act(async () => {
      await localStorage.clear()
    })
  })

  it('should store token in localStorage after successful login', async () => {
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
      const user = JSON.parse(await localStorage.getItem('user'))
      expect(token).toBe('test-token')
      expect(user).toEqual({ id: 1, email: 'test@example.com' })
    })
  })

  it('should store token in localStorage after successful signup', async () => {
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
      const user = JSON.parse(await localStorage.getItem('user'))
      expect(token).toBe('test-token')
      expect(user).toEqual({ id: 2, email: 'new@example.com' })
    })
  })

  it('should remove token from localStorage after logout', async () => {
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
      const user = await localStorage.getItem('user')
      expect(token).toBeNull()
      expect(user).toBeNull()
    })
  })

  it('should handle Supabase token fallback', async () => {
    const mockSupabaseToken = 'supabase-token'
    const mockUser = { id: 1, email: 'test@example.com' }

    await act(async () => {
      await localStorage.setItem('sb-token', mockSupabaseToken)
      await localStorage.setItem('sb-user', JSON.stringify(mockUser))
    })

    await act(async () => {
      renderWithProviders(<Auth />)
    })

    await waitFor(async () => {
      const token = await localStorage.getItem('auth_token')
      const user = JSON.parse(await localStorage.getItem('user'))
      expect(token).toBe(mockSupabaseToken)
      expect(user).toEqual(mockUser)
    })
  })
}) 