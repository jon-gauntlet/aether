import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithTheme, createTestProps, createTestFile, createDragEvent, waitForAnimations } from '../../test/utils'

describe('FileUpload', () => {
  let props
  let mockUploadFn

  beforeEach(() => {
    mockUploadFn = vi.fn()
    props = createTestProps({
      onUpload: mockUploadFn,
      maxSize: 5 * 1024 * 1024, // 5MB
      acceptedTypes: ['image/*', '.pdf'],
      multiple: true
    })
  })

  describe('Rendering', () => {
    it('renders upload zone correctly', () => {
      renderWithTheme(<FileUpload {...props} />)
      
      expect(screen.getByText(/drop files here/i)).toBeInTheDocument()
      expect(screen.getByText(/or click to select/i)).toBeInTheDocument()
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Upload files')
    })

    it('shows file type restrictions', () => {
      renderWithTheme(<FileUpload {...props} />)
      
      expect(screen.getByText(/accepted formats/i)).toBeInTheDocument()
      expect(screen.getByText(/images, pdf/i)).toBeInTheDocument()
    })

    it('shows size limit', () => {
      renderWithTheme(<FileUpload {...props} />)
      
      expect(screen.getByText(/max size: 5mb/i)).toBeInTheDocument()
    })
  })

  describe('File Selection', () => {
    it('handles file selection via click', async () => {
      const { user } = renderWithTheme(<FileUpload {...props} />)
      const file = createTestFile('test.jpg', 'image/jpeg', 1024)
      const input = screen.getByLabelText(/upload files/i)

      await user.upload(input, file)

      expect(screen.getByText(/test.jpg/i)).toBeInTheDocument()
      expect(screen.getByText(/1 kb/i)).toBeInTheDocument()
    })

    it('handles multiple file selection', async () => {
      const { user } = renderWithTheme(<FileUpload {...props} />)
      const files = [
        createTestFile('test1.jpg', 'image/jpeg', 1024),
        createTestFile('test2.pdf', 'application/pdf', 2048)
      ]
      const input = screen.getByLabelText(/upload files/i)

      await user.upload(input, files)

      expect(screen.getByText(/test1.jpg/i)).toBeInTheDocument()
      expect(screen.getByText(/test2.pdf/i)).toBeInTheDocument()
    })

    it('handles drag and drop', async () => {
      renderWithTheme(<FileUpload {...props} />)
      const dropZone = screen.getByText(/drop files here/i)
      const file = createTestFile('test.jpg', 'image/jpeg', 1024)

      // Simulate drag events
      dropZone.dispatchEvent(createDragEvent('dragenter', [file]))
      dropZone.dispatchEvent(createDragEvent('dragover', [file]))
      dropZone.dispatchEvent(createDragEvent('drop', [file]))

      await waitFor(() => {
        expect(screen.getByText(/test.jpg/i)).toBeInTheDocument()
      })
    })
  })

  describe('Validation', () => {
    it('validates file type', async () => {
      const { user } = renderWithTheme(<FileUpload {...props} />)
      const file = createTestFile('test.txt', 'text/plain', 1024)
      const input = screen.getByLabelText(/upload files/i)

      await user.upload(input, file)

      expect(screen.getByText(/file type not allowed/i)).toBeInTheDocument()
    })

    it('validates file size', async () => {
      const { user } = renderWithTheme(<FileUpload {...props} />)
      const file = createTestFile('large.jpg', 'image/jpeg', 6 * 1024 * 1024) // 6MB
      const input = screen.getByLabelText(/upload files/i)

      await user.upload(input, file)

      expect(screen.getByText(/file too large/i)).toBeInTheDocument()
    })

    it('handles duplicate files', async () => {
      const { user } = renderWithTheme(<FileUpload {...props} />)
      const file = createTestFile('test.jpg', 'image/jpeg', 1024)
      const input = screen.getByLabelText(/upload files/i)

      await user.upload(input, file)
      await user.upload(input, file)

      expect(screen.getByText(/file already selected/i)).toBeInTheDocument()
    })
  })

  describe('Upload Process', () => {
    it('shows upload progress', async () => {
      const { user } = renderWithTheme(<FileUpload {...props} />)
      const file = createTestFile('test.jpg', 'image/jpeg', 1024)
      mockUploadFn.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve({ success: true }), 100)
        })
      })

      await user.upload(screen.getByLabelText(/upload files/i), file)
      await user.click(screen.getByRole('button', { name: /upload/i }))

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      await waitFor(() => {
        expect(screen.getByText(/upload complete/i)).toBeInTheDocument()
      })
    })

    it('handles upload cancellation', async () => {
      const { user } = renderWithTheme(<FileUpload {...props} />)
      const file = createTestFile('test.jpg', 'image/jpeg', 1024)
      const cancelFn = vi.fn()
      mockUploadFn.mockImplementation(() => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => resolve({ success: true }), 1000)
          cancelFn.mockImplementation(() => {
            clearTimeout(timeout)
            reject(new Error('Upload cancelled'))
          })
        })
      })

      await user.upload(screen.getByLabelText(/upload files/i), file)
      await user.click(screen.getByRole('button', { name: /upload/i }))
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(screen.getByText(/upload cancelled/i)).toBeInTheDocument()
    })

    it('handles upload errors', async () => {
      const { user } = renderWithTheme(<FileUpload {...props} />)
      const file = createTestFile('test.jpg', 'image/jpeg', 1024)
      mockUploadFn.mockRejectedValueOnce(new Error('Upload failed'))

      await user.upload(screen.getByLabelText(/upload files/i), file)
      await user.click(screen.getByRole('button', { name: /upload/i }))

      await waitFor(() => {
        expect(screen.getByText(/upload failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('File Management', () => {
    it('allows file removal', async () => {
      const { user } = renderWithTheme(<FileUpload {...props} />)
      const file = createTestFile('test.jpg', 'image/jpeg', 1024)

      await user.upload(screen.getByLabelText(/upload files/i), file)
      await user.click(screen.getByRole('button', { name: /remove/i }))

      expect(screen.queryByText(/test.jpg/i)).not.toBeInTheDocument()
    })

    it('clears files after successful upload', async () => {
      const { user } = renderWithTheme(<FileUpload {...props} />)
      const file = createTestFile('test.jpg', 'image/jpeg', 1024)
      mockUploadFn.mockResolvedValueOnce({ success: true })

      await user.upload(screen.getByLabelText(/upload files/i), file)
      await user.click(screen.getByRole('button', { name: /upload/i }))

      await waitFor(() => {
        expect(screen.queryByText(/test.jpg/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('announces drag events', async () => {
      renderWithTheme(<FileUpload {...props} />)
      const dropZone = screen.getByText(/drop files here/i)

      dropZone.dispatchEvent(createDragEvent('dragenter'))
      expect(screen.getByRole('status')).toHaveTextContent(/drop files to upload/i)

      dropZone.dispatchEvent(createDragEvent('dragleave'))
      expect(screen.getByRole('status')).toHaveTextContent(/drag and drop files/i)
    })

    it('announces upload progress', async () => {
      const { user } = renderWithTheme(<FileUpload {...props} />)
      const file = createTestFile('test.jpg', 'image/jpeg', 1024)
      mockUploadFn.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve({ success: true }), 100)
        })
      })

      await user.upload(screen.getByLabelText(/upload files/i), file)
      await user.click(screen.getByRole('button', { name: /upload/i }))

      expect(screen.getByRole('status')).toHaveTextContent(/uploading/i)
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/upload complete/i)
      })
    })
  })

  describe('Performance', () => {
    it('throttles drag events', async () => {
      renderWithTheme(<FileUpload {...props} />)
      const dropZone = screen.getByText(/drop files here/i)
      const dragEvents = Array(10).fill(createDragEvent('dragover'))

      dragEvents.forEach(event => dropZone.dispatchEvent(event))
      await waitForAnimations()

      // Should only process the last event
      expect(screen.getAllByRole('status')).toHaveLength(1)
    })

    it('optimizes file preview generation', async () => {
      const { user } = renderWithTheme(<FileUpload {...props} />)
      const largeFile = createTestFile('large.jpg', 'image/jpeg', 5 * 1024 * 1024)

      await user.upload(screen.getByLabelText(/upload files/i), largeFile)
      await waitForAnimations()

      // Preview should be generated without blocking UI
      expect(screen.getByRole('img', { name: /preview/i })).toBeInTheDocument()
    })
  })
}) 