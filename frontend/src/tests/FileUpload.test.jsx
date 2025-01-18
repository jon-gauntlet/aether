import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { FileUpload } from '../components/FileUpload'
import { TestWrapper } from './TestWrapper'

describe('FileUpload', () => {
  const mockOnUpload = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders upload button', () => {
    render(<FileUpload onUpload={mockOnUpload} />, { wrapper: TestWrapper })
    expect(screen.getByTestId('file-upload-button')).toBeInTheDocument()
  })

  it('handles file selection', async () => {
    render(<FileUpload onUpload={mockOnUpload} />, { wrapper: TestWrapper })
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const input = screen.getByTestId('file-input')
    
    Object.defineProperty(input, 'files', {
      value: [file]
    })

    fireEvent.change(input)

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(file)
    })
  })

  it('shows loading state', () => {
    render(<FileUpload onUpload={mockOnUpload} isLoading={true} />, { wrapper: TestWrapper })
    expect(screen.getByTestId('file-upload-button')).toHaveAttribute('data-loading')
  })

  it('handles upload errors', async () => {
    const error = new Error('Upload failed')
    mockOnUpload.mockRejectedValueOnce(error)
    
    render(<FileUpload onUpload={mockOnUpload} />, { wrapper: TestWrapper })
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const input = screen.getByTestId('file-input')
    
    Object.defineProperty(input, 'files', {
      value: [file]
    })

    fireEvent.change(input)

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalled()
    })
  })
}) 