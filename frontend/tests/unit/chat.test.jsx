import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { ChatContainer } from '../../src/components/chat/ChatContainer'
import { AuthProvider } from '../../src/contexts/AuthContext'
import { supabase } from '../../src/lib/supabaseClient'

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock WebSocket
global.WebSocket = class {
  constructor() {
    setTimeout(() => {
      this.onmessage?.({ data: JSON.stringify({ id: Date.now().toString(), content: 'New message', username: 'test' }) })
    }, 0)
  }
  close() {}
}

// Mock Supabase storage and auth
vi.mock('../../src/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: { user: { email: 'test@example.com' } } }, error: null })),
      onAuthStateChange: vi.fn((callback) => {
        callback('SIGNED_IN', { user: { email: 'test@example.com' } })
        return { data: { subscription: { unsubscribe: vi.fn() } }, error: null }
      }),
      signOut: vi.fn(() => Promise.resolve({ error: null }))
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: { path: 'test.pdf' }, error: null })),
        download: vi.fn(() => Promise.resolve({ data: new Blob(['test content']), error: null })),
        remove: vi.fn(() => Promise.resolve({ data: { path: 'test.pdf' }, error: null })),
        list: vi.fn(() => Promise.resolve({ data: [{ name: 'test.pdf' }], error: null }))
      }))
    }
  }
}))

describe('ChatContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    localStorage.setItem('auth_token', 'test-token')
  })

  const mockAuthResponse = {
    ok: true,
    json: async () => ({
      user: { email: 'test@example.com' }
    })
  }

  const renderWithAuth = async () => {
    // Mock initial auth check
    mockFetch.mockResolvedValueOnce(mockAuthResponse)

    const result = render(
      <ChakraProvider>
        <AuthProvider>
          <ChatContainer />
        </AuthProvider>
      </ChakraProvider>
    )

    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.queryByText('Please log in to access the chat.')).not.toBeInTheDocument()
    })

    return result
  }

  it('should load messages on mount', async () => {
    mockFetch
      .mockResolvedValueOnce(mockAuthResponse)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([{ id: 'msg1', content: 'Test message', username: 'test' }])
      })

    await renderWithAuth()

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/messages/general', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      })
      expect(screen.getByText('Test message')).toBeInTheDocument()
    })
  })

  it('should send message and update UI', async () => {
    mockFetch
      .mockResolvedValueOnce(mockAuthResponse)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      })
      .mockResolvedValueOnce({
        ok: true
      })

    await renderWithAuth()

    const input = screen.getByTestId('message-input')
    const button = screen.getByTestId('send-button')

    fireEvent.change(input, { target: { value: 'New message' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          content: 'New message',
          channel: 'general',
          username: 'test@example.com'
        })
      })
    })
  })

  it('should handle channel switching', async () => {
    mockFetch
      .mockResolvedValueOnce(mockAuthResponse)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([{ id: 'msg3', content: 'Random message', username: 'test' }])
      })

    await renderWithAuth()

    const select = screen.getByTestId('channel-select')
    fireEvent.change(select, { target: { value: 'random' } })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/messages/random', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      })
      expect(screen.getByText('Random message')).toBeInTheDocument()
    })
  })

  it('should handle real-time updates', async () => {
    mockFetch
      .mockResolvedValueOnce(mockAuthResponse)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      })

    await renderWithAuth()

    await waitFor(() => {
      expect(screen.getByText('New message')).toBeInTheDocument()
    })
  })

  it('should handle errors when loading messages', async () => {
    mockFetch
      .mockResolvedValueOnce(mockAuthResponse)
      .mockRejectedValueOnce(new Error('Failed to load messages'))

    await renderWithAuth()

    await waitFor(() => {
      expect(screen.getByText('Failed to load messages')).toBeInTheDocument()
    })
  })

  it('should handle errors when sending messages', async () => {
    mockFetch
      .mockResolvedValueOnce(mockAuthResponse)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      })
      .mockRejectedValueOnce(new Error('Failed to send message'))

    await renderWithAuth()

    const input = screen.getByTestId('message-input')
    const button = screen.getByTestId('send-button')

    fireEvent.change(input, { target: { value: 'New message' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Failed to send message')).toBeInTheDocument()
    })
  })

  describe('File Handling', () => {
    it('should open file drawer when clicking Files button', async () => {
      await renderWithAuth()

      const filesButton = screen.getByText('Files')
      fireEvent.click(filesButton)

      await waitFor(() => {
        expect(screen.getByText('Chat Files')).toBeInTheDocument()
      })
    })

    it('should upload file in chat', async () => {
      await renderWithAuth()

      const filesButton = screen.getByText('Files')
      fireEvent.click(filesButton)

      await waitFor(() => {
        expect(screen.getByText('Chat Files')).toBeInTheDocument()
      })

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const input = screen.getByTestId('file-input')
      fireEvent.change(input, { target: { files: [file] } })

      const uploadButton = screen.getByTestId('upload-button')
      fireEvent.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByText('File uploaded successfully')).toBeInTheDocument()
      })
    })

    it('should download file from chat', async () => {
      await renderWithAuth()

      const filesButton = screen.getByText('Files')
      fireEvent.click(filesButton)

      await waitFor(() => {
        expect(screen.getByTestId('file-name')).toHaveTextContent('test.pdf')
      })

      const downloadButton = screen.getByTestId('download-button')
      fireEvent.click(downloadButton)

      await waitFor(() => {
        expect(screen.getByText('File downloaded successfully')).toBeInTheDocument()
      })
    })

    it('should delete file from chat', async () => {
      await renderWithAuth()

      const filesButton = screen.getByText('Files')
      fireEvent.click(filesButton)

      await waitFor(() => {
        expect(screen.getByTestId('file-name')).toHaveTextContent('test.pdf')
      })

      const deleteButton = screen.getByTestId('delete-button')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('File deleted successfully')).toBeInTheDocument()
      })
    })

    it('should handle file upload errors', async () => {
      // Mock upload error
      const mockUpload = vi.fn(() => Promise.resolve({ data: null, error: { message: 'Upload failed' } }))
      const mockFrom = vi.fn(() => ({
        upload: mockUpload,
        download: vi.fn(),
        remove: vi.fn(),
        list: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
      vi.mocked(supabase.storage.from).mockImplementation(mockFrom)

      await renderWithAuth()

      const filesButton = screen.getByText('Files')
      fireEvent.click(filesButton)

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const input = screen.getByTestId('file-input')
      fireEvent.change(input, { target: { files: [file] } })

      const uploadButton = screen.getByTestId('upload-button')
      fireEvent.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByTestId('message')).toHaveTextContent('Upload failed')
      })
    })
  })
}) 