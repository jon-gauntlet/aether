import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChakraProvider } from '@chakra-ui/react'
import { FileUpload } from '../src/components/FileUpload'
import { supabase } from '../src/lib/supabaseClient'

// Mock Supabase storage
vi.mock('../src/lib/supabaseClient', () => ({
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
  })

  it('should upload file successfully', async () => {
    const user = userEvent.setup()
    renderWithChakra(<FileUpload />)
    
    // Create test file
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    const input = screen.getByTestId('file-input')
    await user.upload(input, file)

    // Click upload button
    const uploadButton = screen.getByTestId('upload-button')
    await user.click(uploadButton)
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('File uploaded successfully')).toBeInTheDocument()
    })
  })

  it('should validate file size', async () => {
    const user = userEvent.setup()
    renderWithChakra(<FileUpload />)
    
    // Create large file (11MB)
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' })
    const input = screen.getByTestId('file-input')
    await user.upload(input, largeFile)
    
    // Verify error message
    await waitFor(() => {
      expect(screen.getByTestId('message')).toHaveTextContent(/file size exceeds/i)
    })
  })

  it('should handle upload errors', async () => {
    const user = userEvent.setup()
    
    // Mock upload error
    vi.mocked(supabase.storage.from).mockImplementation(() => ({
      upload: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Upload failed' } })),
      download: vi.fn(),
      remove: vi.fn(),
      list: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }))
    
    renderWithChakra(<FileUpload />)
    
    // Upload file
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    const input = screen.getByTestId('file-input')
    await user.upload(input, file)

    const uploadButton = screen.getByTestId('upload-button')
    await user.click(uploadButton)
    
    // Verify error message
    await waitFor(() => {
      expect(screen.getByTestId('message')).toHaveTextContent('Upload failed')
    })
  })

  it('should download file successfully', async () => {
    const user = userEvent.setup()
    renderWithChakra(<FileUpload />)
    
    // Wait for file list to load
    await waitFor(() => {
      expect(screen.getByTestId('file-name')).toHaveTextContent('test.pdf')
    })
    
    // Click download button
    await user.click(screen.getByTestId('download-button'))
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('File downloaded successfully')).toBeInTheDocument()
    })
  })

  it('should delete file successfully', async () => {
    const user = userEvent.setup()
    renderWithChakra(<FileUpload />)
    
    // Wait for file list to load
    await waitFor(() => {
      expect(screen.getByTestId('file-name')).toHaveTextContent('test.pdf')
    })
    
    // Click delete button
    await user.click(screen.getByTestId('delete-button'))
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('File deleted successfully')).toBeInTheDocument()
    })
  })
}) 