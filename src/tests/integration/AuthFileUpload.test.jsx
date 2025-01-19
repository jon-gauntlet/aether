import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithTheme, createTestProps, createTestFile, waitForAnimations } from '../../test/utils'
import { AuthProvider } from '../../components/Auth/AuthProvider'
import { FileUpload } from '../../components/FileUpload/FileUpload'

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn()
    },
    storage: {
      from: () => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn()
      })
    }
  })
}))

describe('Auth + File Upload Integration', () => {
  let props
  let mockSupabase
  let mockStorage

  beforeEach(() => {
    mockStorage = {
      upload: vi.fn(),
      getPublicUrl: vi.fn()
    }
    mockSupabase = {
      auth: {
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn(),
        onAuthStateChange: vi.fn()
      },
      storage: {
        from: () => mockStorage
      }
    }
    props = createTestProps()
  })

  describe('Authentication Flow with File Upload', () => {
    it('requires authentication before file upload', async () => {
      const { user } = renderWithTheme(
        <AuthProvider supabase={mockSupabase}>
          <FileUpload {...props} />
        </AuthProvider>
      )

      // Initially shows sign in requirement
      expect(screen.getByText(/sign in to upload files/i)).toBeInTheDocument()
      expect(screen.queryByText(/drop files here/i)).not.toBeInTheDocument()

      // Sign in
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: '123' } },
        error: null
      })

      // After sign in, shows file upload
      await waitFor(() => {
        expect(screen.getByText(/drop files here/i)).toBeInTheDocument()
      })
    })

    it('handles file upload with authenticated session', async () => {
      // Start with authenticated session
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { 
          session: { 
            user: { id: '123' },
            access_token: 'valid-token'
          }
        },
        error: null
      })

      const { user } = renderWithTheme(
        <AuthProvider supabase={mockSupabase}>
          <FileUpload {...props} />
        </AuthProvider>
      )

      const file = createTestFile('test.jpg', 'image/jpeg', 1024)
      mockStorage.upload.mockResolvedValueOnce({ data: { path: 'test.jpg' }, error: null })
      mockStorage.getPublicUrl.mockReturnValueOnce({ data: { publicUrl: 'https://test.com/test.jpg' } })

      await user.upload(screen.getByLabelText(/upload files/i), file)
      await user.click(screen.getByRole('button', { name: /upload/i }))

      await waitFor(() => {
        expect(mockStorage.upload).toHaveBeenCalledWith('test.jpg', expect.any(File), {
          cacheControl: '3600',
          upsert: false
        })
      })
    })

    it('handles session expiration during upload', async () => {
      // Start with authenticated session
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { 
          session: { 
            user: { id: '123' },
            access_token: 'valid-token'
          }
        },
        error: null
      })

      const { user } = renderWithTheme(
        <AuthProvider supabase={mockSupabase}>
          <FileUpload {...props} />
        </AuthProvider>
      )

      const file = createTestFile('test.jpg', 'image/jpeg', 1024)
      mockStorage.upload.mockRejectedValueOnce(new Error('Invalid token'))

      await user.upload(screen.getByLabelText(/upload files/i), file)
      await user.click(screen.getByRole('button', { name: /upload/i }))

      await waitFor(() => {
        expect(screen.getByText(/please sign in again/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Recovery', () => {
    it('recovers from network errors during upload', async () => {
      // Start authenticated
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { 
          session: { 
            user: { id: '123' },
            access_token: 'valid-token'
          }
        },
        error: null
      })

      const { user } = renderWithTheme(
        <AuthProvider supabase={mockSupabase}>
          <FileUpload {...props} />
        </AuthProvider>
      )

      const file = createTestFile('test.jpg', 'image/jpeg', 1024)
      
      // First attempt fails
      mockStorage.upload.mockRejectedValueOnce(new Error('Network error'))
      
      await user.upload(screen.getByLabelText(/upload files/i), file)
      await user.click(screen.getByRole('button', { name: /upload/i }))

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })

      // Second attempt succeeds
      mockStorage.upload.mockResolvedValueOnce({ data: { path: 'test.jpg' }, error: null })
      mockStorage.getPublicUrl.mockReturnValueOnce({ data: { publicUrl: 'https://test.com/test.jpg' } })

      await user.click(screen.getByRole('button', { name: /retry/i }))

      await waitFor(() => {
        expect(screen.getByText(/upload complete/i)).toBeInTheDocument()
      })
    })

    it('handles rate limiting across components', async () => {
      const { user } = renderWithTheme(
        <AuthProvider supabase={mockSupabase}>
          <FileUpload {...props} />
        </AuthProvider>
      )

      // Trigger rate limit on sign in
      mockSupabase.auth.signInWithPassword.mockRejectedValueOnce(new Error('Too many requests'))

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/too many requests/i)).toBeInTheDocument()
      })

      // Wait and retry
      await waitForAnimations()
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: '123' } },
        error: null
      })

      await user.click(screen.getByRole('button', { name: /try again/i }))

      await waitFor(() => {
        expect(screen.getByText(/drop files here/i)).toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('optimizes concurrent operations', async () => {
      // Start authenticated
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { 
          session: { 
            user: { id: '123' },
            access_token: 'valid-token'
          }
        },
        error: null
      })

      const { user } = renderWithTheme(
        <AuthProvider supabase={mockSupabase}>
          <FileUpload {...props} />
        </AuthProvider>
      )

      const files = [
        createTestFile('test1.jpg', 'image/jpeg', 1024),
        createTestFile('test2.jpg', 'image/jpeg', 1024),
        createTestFile('test3.jpg', 'image/jpeg', 1024)
      ]

      // Setup mock responses
      files.forEach((_, index) => {
        mockStorage.upload.mockResolvedValueOnce({ 
          data: { path: `test${index + 1}.jpg` },
          error: null
        })
        mockStorage.getPublicUrl.mockReturnValueOnce({
          data: { publicUrl: `https://test.com/test${index + 1}.jpg` }
        })
      })

      await user.upload(screen.getByLabelText(/upload files/i), files)
      await user.click(screen.getByRole('button', { name: /upload/i }))

      // Should handle concurrent uploads efficiently
      await waitFor(() => {
        expect(mockStorage.upload).toHaveBeenCalledTimes(3)
      })

      // Should maintain UI responsiveness
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      await user.hover(screen.getByRole('button', { name: /cancel/i }))
      expect(document.activeElement).toBe(screen.getByRole('button', { name: /cancel/i }))
    })
  })

  describe('State Management', () => {
    it('preserves upload state across auth changes', async () => {
      // Start authenticated
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { 
          session: { 
            user: { id: '123' },
            access_token: 'valid-token'
          }
        },
        error: null
      })

      const { user } = renderWithTheme(
        <AuthProvider supabase={mockSupabase}>
          <FileUpload {...props} />
        </AuthProvider>
      )

      // Select files
      const files = [
        createTestFile('test1.jpg', 'image/jpeg', 1024),
        createTestFile('test2.jpg', 'image/jpeg', 1024)
      ]
      await user.upload(screen.getByLabelText(/upload files/i), files)

      // Simulate token refresh
      mockSupabase.auth.onAuthStateChange.mock.calls[0][0]('TOKEN_REFRESHED', {
        user: { id: '123' },
        access_token: 'new-token'
      })

      // Files should still be present
      expect(screen.getByText(/test1.jpg/i)).toBeInTheDocument()
      expect(screen.getByText(/test2.jpg/i)).toBeInTheDocument()

      // Should be able to proceed with upload
      mockStorage.upload.mockResolvedValueOnce({ data: { path: 'test1.jpg' }, error: null })
      mockStorage.getPublicUrl.mockReturnValueOnce({ data: { publicUrl: 'https://test.com/test1.jpg' } })

      await user.click(screen.getByRole('button', { name: /upload/i }))

      await waitFor(() => {
        expect(mockStorage.upload).toHaveBeenCalled()
      })
    })
  })
}) 