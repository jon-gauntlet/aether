import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Auth } from '../../src/components/Auth'
import { AuthProvider } from '../../src/contexts/AuthContext'

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    localStorage.clear()
  })

  it('renders login form', () => {
    render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    )

    expect(screen.getByTestId('email-input')).toBeInTheDocument()
    expect(screen.getByTestId('password-input')).toBeInTheDocument()
    expect(screen.getByTestId('login-button')).toBeInTheDocument()
  })

  it('handles successful login', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { email: 'test@example.com' },
        session: { token: 'test-token' }
      })
    })

    render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    )

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password' }
    })
    fireEvent.click(screen.getByTestId('login-button'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password'
        })
      })
    })

    expect(localStorage.getItem('auth_token')).toBe('test-token')
  })

  it('handles failed login', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Invalid credentials'
      })
    })

    render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    )

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'wrong@example.com' }
    })
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'wrongpass' }
    })
    fireEvent.click(screen.getByTestId('login-button'))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials')
    })
  })

  it('validates required fields', async () => {
    render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    )

    fireEvent.click(screen.getByTestId('login-button'))

    await waitFor(() => {
      expect(screen.getByTestId('email-input')).toBeInvalid()
      expect(screen.getByTestId('password-input')).toBeInvalid()
    })
  })

  it('disables form during submission', async () => {
    mockFetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    )

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password' }
    })
    fireEvent.click(screen.getByTestId('login-button'))

    expect(screen.getByTestId('email-input')).toBeDisabled()
    expect(screen.getByTestId('password-input')).toBeDisabled()
    expect(screen.getByTestId('login-button')).toBeDisabled()
  })
}) 