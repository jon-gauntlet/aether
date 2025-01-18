import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { supabase } from '../../src/lib/supabaseClient'
import { FileUpload } from '../../src/components/FileUpload'

// Mock URL.createObjectURL
const mockCreateObjectURL = vi.fn()
const mockRevokeObjectURL = vi.fn()
global.URL.createObjectURL = mockCreateObjectURL
global.URL.revokeObjectURL = mockRevokeObjectURL

// Mock Supabase storage
vi.mock('../../src/lib/supabaseClient', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => ({ data: { path: 'test.pdf' }, error: null })),
        download: vi.fn(() => ({ data: new Blob(['test content']), error: null })),
        remove: vi.fn(() => ({ data: { path: 'test.pdf' }, error: null })),
        list: vi.fn(() => ({ data: [{ name: 'test.pdf' }], error: null }))
      }))
    }
  }
}))

describe('File Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateObjectURL.mockReturnValue('blob:test-url')
  })

  describe('Upload', () => {
    it('should upload file successfully', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      
      render(<FileUpload />)
      
      const input = screen.getByTestId('file-input')
      fireEvent.change(input, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByText('File uploaded successfully')).toBeInTheDocument()
      })
    })

    it('should validate file size', async () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' })
      
      render(<FileUpload />)
      
      const input = screen.getByTestId('file-input')
      fireEvent.change(input, { target: { files: [largeFile] } })
      
      await waitFor(() => {
        expect(screen.getByText(/file size exceeds/i)).toBeInTheDocument()
      })
    })

    it('should handle upload errors', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      
      // Mock upload error
      const mockFrom = vi.fn(() => ({
        upload: vi.fn(() => ({ data: null, error: { message: 'Upload failed' } })),
        download: vi.fn(),
        remove: vi.fn(),
        list: vi.fn(() => ({ data: [], error: null }))
      }))
      vi.mocked(supabase.storage.from).mockImplementation(mockFrom)
      
      render(<FileUpload />)
      
      const input = screen.getByTestId('file-input')
      fireEvent.change(input, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument()
      })
    })
  })

  describe('Download', () => {
    it('should download file successfully', async () => {
      render(<FileUpload />)
      
      await waitFor(() => {
        expect(screen.getByTestId('download-button')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByTestId('download-button'))
      
      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled()
        expect(screen.getByText('File downloaded successfully')).toBeInTheDocument()
      })
    })

    it('should handle download errors', async () => {
      // Mock download error
      const mockFrom = vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(() => ({ data: null, error: { message: 'File not found' } })),
        remove: vi.fn(),
        list: vi.fn(() => ({ data: [{ name: 'test.pdf' }], error: null }))
      }))
      vi.mocked(supabase.storage.from).mockImplementation(mockFrom)
      
      render(<FileUpload />)
      
      await waitFor(() => {
        expect(screen.getByTestId('download-button')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByTestId('download-button'))
      
      await waitFor(() => {
        expect(screen.getByText('File not found')).toBeInTheDocument()
      })
    })
  })

  describe('Delete', () => {
    it('should delete file successfully', async () => {
      render(<FileUpload />)
      
      await waitFor(() => {
        expect(screen.getByTestId('delete-button')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByTestId('delete-button'))
      
      await waitFor(() => {
        expect(screen.getByText('File deleted successfully')).toBeInTheDocument()
      })
    })
  })

  describe('List Files', () => {
    it('should list files on mount', async () => {
      render(<FileUpload />)
      
      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument()
      })
    })

    it('should handle list errors', async () => {
      // Mock list error
      const mockFrom = vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
        list: vi.fn(() => ({ data: null, error: { message: 'Failed to list files' } }))
      }))
      vi.mocked(supabase.storage.from).mockImplementation(mockFrom)
      
      render(<FileUpload />)
      
      await waitFor(() => {
        expect(screen.getByText('Failed to list files')).toBeInTheDocument()
      })
    })
  })
}) 