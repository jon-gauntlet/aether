import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithTheme, createTestProps, waitForAnimations } from '../../test/utils'

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn()
    }
  })
}))

describe('Authentication', () => {
  let props
  let mockSupabase

  beforeEach(() => {
    props = createTestProps()
    mockSupabase = {
      auth: {
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn(),
        onAuthStateChange: vi.fn()
      }
    }
  })

  describe('Sign In', () => {
    it('renders sign in form correctly', () => {
      renderWithTheme(<SignIn {...props} />)
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('handles successful sign in', async () => {
      const { user } = renderWithTheme(<SignIn {...props} supabase={mockSupabase} />)
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({ 
        data: { user: { id: '123' } }, 
        error: null 
      })

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        })
      })
    })

    it('handles sign in errors', async () => {
      const { user } = renderWithTheme(<SignIn {...props} supabase={mockSupabase} />)
      mockSupabase.auth.signInWithPassword.mockRejectedValueOnce(new Error('Invalid credentials'))

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'wrong')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
    })

    it('validates required fields', async () => {
      const { user } = renderWithTheme(<SignIn {...props} />)
      
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  describe('Sign Up', () => {
    it('renders sign up form correctly', () => {
      renderWithTheme(<SignUp {...props} />)
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    })

    it('handles successful sign up', async () => {
      const { user } = renderWithTheme(<SignUp {...props} supabase={mockSupabase} />)
      mockSupabase.auth.signUp.mockResolvedValueOnce({ 
        data: { user: { id: '123' } }, 
        error: null 
      })

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        })
      })
    })

    it('validates password match', async () => {
      const { user } = renderWithTheme(<SignUp {...props} />)
      
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'different')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })

    it('handles sign up errors', async () => {
      const { user } = renderWithTheme(<SignUp {...props} supabase={mockSupabase} />)
      mockSupabase.auth.signUp.mockRejectedValueOnce(new Error('Email already exists'))

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
      })
    })
  })

  describe('Session Management', () => {
    it('handles session persistence', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: { user: { id: '123' } } },
        error: null
      })

      renderWithTheme(<AuthProvider supabase={mockSupabase}><div>Protected Content</div></AuthProvider>)

      await waitFor(() => {
        expect(screen.getByText(/protected content/i)).toBeInTheDocument()
      })
    })

    it('handles sign out', async () => {
      const { user } = renderWithTheme(
        <AuthProvider supabase={mockSupabase}>
          <SignOut />
        </AuthProvider>
      )

      mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null })

      await user.click(screen.getByRole('button', { name: /sign out/i }))

      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      })
    })

    it('handles auth state changes', async () => {
      const mockCallback = vi.fn()
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        mockCallback.mockImplementation(callback)
        return { unsubscribe: vi.fn() }
      })

      renderWithTheme(
        <AuthProvider supabase={mockSupabase}>
          <div>Content</div>
        </AuthProvider>
      )

      mockCallback('SIGNED_IN', { user: { id: '123' } })

      await waitFor(() => {
        expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles network errors', async () => {
      const { user } = renderWithTheme(<SignIn {...props} supabase={mockSupabase} />)
      mockSupabase.auth.signInWithPassword.mockRejectedValueOnce(new Error('Network error'))

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })

    it('handles rate limiting', async () => {
      const { user } = renderWithTheme(<SignIn {...props} supabase={mockSupabase} />)
      mockSupabase.auth.signInWithPassword.mockRejectedValueOnce(new Error('Too many requests'))

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/too many requests/i)).toBeInTheDocument()
      })
    })

    it('handles invalid tokens', async () => {
      mockSupabase.auth.getSession.mockRejectedValueOnce(new Error('Invalid token'))

      renderWithTheme(
        <AuthProvider supabase={mockSupabase}>
          <div>Protected Content</div>
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText(/please sign in again/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('maintains focus management', async () => {
      const { user } = renderWithTheme(<SignIn {...props} />)
      
      await user.tab()
      expect(screen.getByLabelText(/email/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText(/password/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('button', { name: /sign in/i })).toHaveFocus()
    })

    it('announces form errors', async () => {
      const { user } = renderWithTheme(<SignIn {...props} />)
      
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      const errors = screen.getAllByRole('alert')
      expect(errors).toHaveLength(2) // Email and password required errors
      errors.forEach(error => {
        expect(error).toHaveAttribute('aria-live', 'polite')
      })
    })
  })

  describe('Performance', () => {
    it('debounces form submission', async () => {
      const { user } = renderWithTheme(<SignIn {...props} supabase={mockSupabase} />)
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      
      // Rapid clicks
      await user.click(screen.getByRole('button', { name: /sign in/i }))
      await user.click(screen.getByRole('button', { name: /sign in/i }))
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledTimes(1)
      })
    })

    it('cleans up auth subscriptions', () => {
      const unsubscribe = vi.fn()
      mockSupabase.auth.onAuthStateChange.mockReturnValue({ unsubscribe })

      const { unmount } = renderWithTheme(
        <AuthProvider supabase={mockSupabase}>
          <div>Content</div>
        </AuthProvider>
      )

      unmount()
      expect(unsubscribe).toHaveBeenCalled()
    })
  })
}) 