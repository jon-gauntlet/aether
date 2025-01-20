import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { supabase } from '../../../src/lib/supabaseClient'
import { FileUpload } from '../../../src/components/FileUpload'
import { AuthProvider } from '../../contexts/AuthContext'
import { ThemeProvider } from '../../contexts/ThemeContext'

// Mock URL.createObjectURL
const mockCreateObjectURL = vi.fn()
const mockRevokeObjectURL = vi.fn()
global.URL.createObjectURL = mockCreateObjectURL
global.URL.revokeObjectURL = mockRevokeObjectURL

// Mock Supabase storage
vi.mock('../../../src/lib/supabaseClient', () => ({
  supabase: {
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

const TestWrapper = ({ children }) => (
  <AuthProvider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </AuthProvider>
)

const renderWithProviders = (ui, options = {}) => {
  return render(ui, { wrapper: TestWrapper, ...options })
}

const renderWithChakra = (component) => {
  return render(
    <ChakraProvider>
      {component}
    </ChakraProvider>
  )
}

describe('File Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateObjectURL.mockReturnValue('blob:test-url')
  })

  describe('Upload', () => {
    it('should upload file successfully', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      
      renderWithProviders(<FileUpload />)
      
      const input = screen.getByTestId('file-input')
      fireEvent.change(input, { target: { files: [file] } })

      const uploadButton = screen.getByTestId('upload-button')
      fireEvent.click(uploadButton)
      
      await waitFor(() => {
        expect(screen.queryByText('File uploaded successfully')).toBeInTheDocument()
      })
    })

    it('should validate file size', async () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' })
      
      renderWithProviders(<FileUpload />)
      
      const input = screen.getByTestId('file-input')
      fireEvent.change(input, { target: { files: [largeFile] } })
      
      await waitFor(() => {
        expect(screen.getByTestId('message')).toHaveTextContent(/file size exceeds/i)
      })
    })

    it('should handle upload errors', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      
      // Mock upload error
      const mockUpload = vi.fn(() => Promise.resolve({ data: null, error: { message: 'Upload failed' } }))
      const mockFrom = vi.fn(() => ({
        upload: mockUpload,
        download: vi.fn(),
        remove: vi.fn(),
        list: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
      vi.mocked(supabase.storage.from).mockImplementation(mockFrom)
      
      renderWithProviders(<FileUpload />)
      
      const input = screen.getByTestId('file-input')
      fireEvent.change(input, { target: { files: [file] } })

      const uploadButton = screen.getByTestId('upload-button')
      fireEvent.click(uploadButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('message')).toHaveTextContent('Upload failed')
      })
    })
  })

  describe('Download', () => {
    it('should download file successfully', async () => {
      // Mock initial list call
      const mockFrom = vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(() => Promise.resolve({ data: new Blob(['test content']), error: null })),
        remove: vi.fn(),
        list: vi.fn(() => Promise.resolve({ data: [{ name: 'test.pdf' }], error: null }))
      }))
      vi.mocked(supabase.storage.from).mockImplementation(mockFrom)
      
      renderWithProviders(<FileUpload />)
      
      await waitFor(() => {
        expect(screen.getByTestId('file-name')).toHaveTextContent('test.pdf')
      })
      
      fireEvent.click(screen.getByTestId('download-button'))
      
      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled()
        expect(screen.queryByText('File downloaded successfully')).toBeInTheDocument()
      })
    })

    it('should handle download errors', async () => {
      // Mock download error
      const mockDownload = vi.fn(() => Promise.resolve({ data: null, error: { message: 'File not found' } }))
      const mockFrom = vi.fn(() => ({
        upload: vi.fn(),
        download: mockDownload,
        remove: vi.fn(),
        list: vi.fn(() => Promise.resolve({ data: [{ name: 'test.pdf' }], error: null }))
      }))
      vi.mocked(supabase.storage.from).mockImplementation(mockFrom)
      
      renderWithProviders(<FileUpload />)
      
      await waitFor(() => {
        expect(screen.getByTestId('file-name')).toHaveTextContent('test.pdf')
      })
      
      fireEvent.click(screen.getByTestId('download-button'))
      
      await waitFor(() => {
        expect(screen.getByTestId('message')).toHaveTextContent('File not found')
      })
    })
  })

  describe('Delete', () => {
    it('should delete file successfully', async () => {
      // Mock initial list call and delete
      const mockFrom = vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(() => Promise.resolve({ data: { path: 'test.pdf' }, error: null })),
        list: vi.fn(() => Promise.resolve({ data: [{ name: 'test.pdf' }], error: null }))
      }))
      vi.mocked(supabase.storage.from).mockImplementation(mockFrom)
      
      renderWithProviders(<FileUpload />)
      
      await waitFor(() => {
        expect(screen.getByTestId('file-name')).toHaveTextContent('test.pdf')
      })
      
      fireEvent.click(screen.getByTestId('delete-button'))
      
      await waitFor(() => {
        expect(screen.queryByText('File deleted successfully')).toBeInTheDocument()
      })
    })
  })

  describe('List Files', () => {
    it('should list files on mount', async () => {
      renderWithProviders(<FileUpload />)
      
      await waitFor(() => {
        expect(screen.getByTestId('file-name')).toHaveTextContent('test.pdf')
      })
    })

    it('should handle list errors', async () => {
      // Mock list error
      const mockList = vi.fn(() => Promise.resolve({ data: null, error: { message: 'Failed to list files' } }))
      const mockFrom = vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
        list: mockList
      }))
      vi.mocked(supabase.storage.from).mockImplementation(mockFrom)
      
      renderWithProviders(<FileUpload />)
      
      await waitFor(() => {
        expect(screen.getByTestId('message')).toHaveTextContent('Failed to list files')
      })
    })
  })
}) 