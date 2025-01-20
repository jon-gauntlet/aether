import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { FileUpload } from './FileUpload'
import { ThemeProvider } from '../../contexts/ThemeContext'
import { AuthProvider } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { useFolder } from '../../hooks/useFolder'
import { UPLOAD_CONFIG, UPLOAD_STATES } from '../../config/constants'
import * as supabaseMock from '../../lib/supabase'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { theme } from '../../theme'

// Configure longer timeout for all tests
vi.setConfig({ testTimeout: 10000 })

// Mock Supabase client
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
        list: vi.fn().mockResolvedValue({ data: [{ name: 'test-folder', id: '1' }], error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'test-url' }, error: null })
      }))
    }
  }
}))

vi.mock('../Folder/useFolder', () => ({
  useFolder: () => ({
    folders: [],
    createFolder: vi.fn(),
    navigateFolder: vi.fn()
  })
}))

vi.mock('../ProgressIndicator', () => ({
  useProgress: () => ({
    progress: 50,
    startProgress: vi.fn(),
    updateProgress: vi.fn(),
    completeProgress: vi.fn()
  }),
  ProgressIndicator: ({ progress, 'aria-label': ariaLabel }) => (
    <div role="progressbar" aria-label={ariaLabel} aria-valuenow={progress}>
      {progress}%
    </div>
  )
}))

vi.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({
    user: { id: 'test-user' }
  })
}))

vi.mock('../../contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }) => <div>{children}</div>,
  useTheme: () => ({
    theme: {
      colors: {
        primary: { 500: '#000' },
        error: { 500: '#f00' },
        neutral: { 300: '#ccc' }
      },
      borderRadius: {
        md: '4px'
      }
    }
  })
}))

vi.mock('../../utils/fileUtils', () => ({
  formatFileSize: (bytes) => `${bytes} bytes`,
  getFileType: () => 'default'
}))

vi.mock('../../constants/fileIcons', () => ({
  FILE_ICONS: {
    default: '📄'
  }
}))

vi.mock('./FileUpload.styles', () => ({
  Container: 'div',
  DropZone: ({ children, ...props }) => <div data-testid="dropzone" {...props}>{children}</div>,
  FileList: 'ul',
  FileItem: 'li',
  Button: ({ children, onClick, variant }) => <button onClick={onClick} data-variant={variant}>{children}</button>,
  Message: ({ children, type }) => <div data-type={type}>{children}</div>,
  FilePreview: 'div',
  FileIcon: 'div',
  FileDetails: 'div',
  ButtonGroup: 'div',
  BatchActions: 'div',
  FolderNavigation: 'div',
  FolderPath: ({ children }) => <div style={{ cursor: 'pointer' }}>{children}</div>,
  SearchBar: 'div',
  ProgressIndicator: ({ progress, 'aria-label': ariaLabel }) => (
    <div role="progressbar" aria-label={ariaLabel} aria-valuenow={progress}>
      {progress}%
    </div>
  )
}))

// Mock window.URL.createObjectURL
if (typeof window.URL.createObjectURL === 'undefined') {
  Object.defineProperty(window.URL, 'createObjectURL', {
    value: vi.fn().mockReturnValue('test-url')
  })
}

// Mock window.URL.revokeObjectURL
if (typeof window.URL.revokeObjectURL === 'undefined') {
  Object.defineProperty(window.URL, 'revokeObjectURL', {
    value: vi.fn()
  })
}

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value) },
    clear: () => { store = {} }
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

vi.mock('../../hooks/useFolder', () => ({
  useFolder: () => ({
    currentFolder: 'root',
    folders: [{ name: 'test-folder/', id: '1', metadata: { isFolder: true } }],
    createFolder: vi.fn(),
    navigateToFolder: vi.fn(),
    refreshFolders: vi.fn()
  })
}))

const mockFolders = [
  { name: 'test-folder/', id: '1', metadata: { isFolder: true } }
]

const defaultProps = {
  onError: vi.fn(),
  onSuccess: vi.fn(),
  onProgress: vi.fn()
}

beforeEach(() => {
  vi.mocked(supabase.storage.from).mockImplementation(() => ({
    upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
    list: vi.fn().mockResolvedValue({ data: [{ name: 'test-folder/', id: '1', metadata: { isFolder: true } }], error: null }),
    createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'test-url' }, error: null })
  }))

  const { useFolder } = require('../../hooks/useFolder')
  useFolder.mockReturnValue({
    currentFolder: 'root',
    folders: mockFolders,
    createFolder: vi.fn(),
    navigateToFolder: vi.fn(),
    refreshFolders: vi.fn()
  })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('FileUpload', () => {
  const createFile = (name = 'test.jpg', type = 'image/jpeg', size = 4) => {
    return new File(['test'], name, { type })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('renders upload zone correctly', () => {
      render(<FileUpload {...defaultProps} />)
      expect(screen.getByText(/drag and drop files here/i)).toBeInTheDocument()
    })

    it('shows file type restrictions', () => {
      render(<FileUpload {...defaultProps} />)
      expect(screen.getByText(/accepted formats/i)).toBeInTheDocument()
    })

    it('shows size limit', () => {
      render(<FileUpload {...defaultProps} />)
      expect(screen.getByText(/max size/i)).toBeInTheDocument()
    })
  })

  describe('File Selection', () => {
    it('handles file selection via click', async () => {
      render(<FileUpload {...defaultProps} />)
      const file = createFile()
      const input = screen.getByLabelText(/upload files/i)
      await userEvent.upload(input, file)
      expect(screen.getByText(file.name)).toBeInTheDocument()
    })

    it('handles multiple file selection', async () => {
      render(<FileUpload {...defaultProps} multiple />)
      const files = [
        createFile('test1.jpg'),
        createFile('test2.jpg')
      ]
      const input = screen.getByLabelText(/upload files/i)
      await userEvent.upload(input, files)
      expect(screen.getByText(files[0].name)).toBeInTheDocument()
      expect(screen.getByText(files[1].name)).toBeInTheDocument()
    })

    it('handles drag and drop', async () => {
      render(<FileUpload {...defaultProps} />)
      const file = createFile()
      const dropzone = screen.getByTestId('dropzone')
      
      fireEvent.dragEnter(dropzone)
      expect(dropzone).toHaveStyle({ borderColor: 'var(--color-primary)' })
      
      fireEvent.drop(dropzone, {
        dataTransfer: { files: [file] }
      })
      
      await waitFor(() => {
        expect(screen.getByText(file.name)).toBeInTheDocument()
      })
    })
  })

  describe('Validation', () => {
    it('validates file type', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const { container } = render(<FileUpload {...defaultProps} />)
      const input = container.querySelector('input[type="file"]')
      
      await userEvent.upload(input, file)
      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Invalid file type')
          })
        )
      })
    })

    it('validates file size', async () => {
      const file = new File(['test'.repeat(1000000)], 'test.jpg', { type: 'image/jpeg' })
      const { container } = render(<FileUpload {...defaultProps} />)
      const input = container.querySelector('input[type="file"]')
      
      await userEvent.upload(input, file)
      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('File too large')
          })
        )
      })
    })

    it('handles duplicate files', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const { container } = render(<FileUpload {...defaultProps} />)
      const input = container.querySelector('input[type="file"]')
      
      await userEvent.upload(input, file)
      await userEvent.upload(input, file)
      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('already exists')
          })
        )
      })
    })
  })

  describe('Upload Process', () => {
    it('shows upload progress', async () => {
      render(<FileUpload {...defaultProps} />)
      const file = createFile()
      const input = screen.getByLabelText(/upload files/i)
      await userEvent.upload(input, file)
      
      const uploadButton = screen.getAllByRole('button').find(btn => btn.textContent === 'Upload')
      fireEvent.click(uploadButton)
      
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument()
      })
    })

    it('handles upload cancellation', async () => {
      render(<FileUpload {...defaultProps} />)
      const file = createFile()
      const input = screen.getByLabelText(/upload files/i)
      await userEvent.upload(input, file)
      
      const uploadButton = screen.getAllByRole('button').find(btn => btn.textContent === 'Upload')
      fireEvent.click(uploadButton)
      
      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i })
        fireEvent.click(cancelButton)
      })
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
      })
    })

    it('handles upload errors', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      vi.mocked(supabase.storage.from).mockImplementation(() => ({
        upload: vi.fn().mockRejectedValue(new Error('Upload failed')),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'test-url' }, error: null })
      }))

      const { container } = render(<FileUpload {...defaultProps} />)
      const input = container.querySelector('input[type="file"]')
      await userEvent.upload(input, file)

      const uploadButton = screen.getByRole('button', { name: /^upload$/i })
      fireEvent.click(uploadButton)

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Upload failed')
          })
        )
      })
    })

    it('clears files after successful upload', async () => {
      render(<FileUpload {...defaultProps} />)
      const file = createFile()
      const input = screen.getByLabelText(/upload files/i)
      await userEvent.upload(input, file)
      const uploadButton = screen.getByRole('button', { name: /^upload$/i })
      fireEvent.click(uploadButton)
      await waitFor(() => {
        expect(screen.queryByText(file.name)).not.toBeInTheDocument()
      })
    })

    it('announces upload progress', async () => {
      render(<FileUpload {...defaultProps} />)
      const file = createFile()
      const input = screen.getByLabelText(/upload files/i)
      await userEvent.upload(input, file)
      const uploadButton = screen.getByRole('button', { name: /^upload$/i })
      fireEvent.click(uploadButton)
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument()
      })
    })
  })

  describe('File Management', () => {
    it('allows file removal', async () => {
      render(<FileUpload {...defaultProps} />)
      const file = createFile()
      const input = screen.getByLabelText(/upload files/i)
      await userEvent.upload(input, file)
      const removeButton = screen.getByText(/remove/i)
      fireEvent.click(removeButton)
      expect(screen.queryByText(file.name)).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('announces drag events', () => {
      render(<FileUpload {...defaultProps} />)
      const dropzone = screen.getByText(/drag and drop files here/i)
      fireEvent.dragEnter(dropzone)
      expect(screen.getByText(/drop files here/i)).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('throttles drag events', async () => {
      vi.useFakeTimers()
      render(<FileUpload {...defaultProps} />)
      const dropzone = screen.getByTestId('dropzone')
      const dragStates = []

      // Fire multiple drag events in quick succession
      for (let i = 0; i < 5; i++) {
        fireEvent.dragEnter(dropzone)
        dragStates.push(dropzone.getAttribute('data-dragging'))
        await vi.advanceTimersByTimeAsync(50) // Less than throttle interval
      }

      // Wait for throttle interval
      await vi.advanceTimersByTimeAsync(200)

      // Should have some throttled events
      expect(dragStates.filter(state => state === 'true').length).toBeLessThan(5)
      expect(dragStates.filter(state => state === 'true').length).toBeGreaterThan(0)

      vi.useRealTimers()
    })

    it('optimizes file preview generation', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      render(<FileUpload {...defaultProps} />)
      const input = screen.getByLabelText(/upload files/i)
      await userEvent.upload(input, file)
      expect(screen.getByAltText('File preview')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(supabase.storage.from).mockImplementation(() => ({
        upload: vi.fn()
          .mockRejectedValueOnce(new Error('Upload failed'))
          .mockResolvedValueOnce({ data: {}, error: null }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'test-url' }, error: null })
      }))
    })

    it('handles storage errors', async () => {
      render(<FileUpload {...defaultProps} />)
      const file = createFile()
      const input = screen.getByLabelText(/upload files/i)
      await userEvent.upload(input, file)
      
      const uploadButton = screen.getByRole('button', { name: /^upload$/i })
      fireEvent.click(uploadButton)
      
      await waitFor(() => {
        expect(screen.getByText(/failed to upload/i)).toBeInTheDocument()
      })
    })

    it('handles retry after failed upload', async () => {
      render(<FileUpload {...defaultProps} />)
      const file = createFile()
      const input = screen.getByLabelText(/upload files/i)
      await userEvent.upload(input, file)
      
      // First upload fails
      const uploadButton = screen.getByRole('button', { name: /^upload$/i })
      fireEvent.click(uploadButton)
      
      await waitFor(() => {
        expect(screen.getByText(/failed to upload/i)).toBeInTheDocument()
      })

      // Retry succeeds
      const retryButton = screen.getByRole('button', { name: /^retry$/i })
      fireEvent.click(retryButton)
      
      await waitFor(() => {
        expect(screen.queryByText(/failed to upload/i)).not.toBeInTheDocument()
      })
    })

    it('handles batch retry for multiple failed uploads', async () => {
      vi.mocked(supabase.storage.from).mockImplementation(() => ({
        upload: vi.fn()
          .mockRejectedValueOnce(new Error('Upload failed'))
          .mockRejectedValueOnce(new Error('Upload failed'))
          .mockResolvedValue({ data: {}, error: null }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'test-url' }, error: null })
      }))

      render(<FileUpload {...defaultProps} multiple />)
      const input = screen.getByLabelText(/upload files/i)
      
      // Upload multiple files that fail
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
      ]
      await userEvent.upload(input, files)
      
      const uploadAllButton = screen.getByRole('button', { name: /upload all/i })
      fireEvent.click(uploadAllButton)
      
      await waitFor(() => {
        expect(screen.getAllByText(/failed to upload/i)).toHaveLength(2)
      })

      // Retry all failed uploads
      const retryFailedButton = screen.getByRole('button', { name: /retry failed/i })
      fireEvent.click(retryFailedButton)
      
      await waitFor(() => {
        expect(screen.queryByText(/failed to upload/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Storage Integration', () => {
    it('organizes files in folders', async () => {
      render(<FileUpload {...defaultProps} />)
      
      await waitFor(() => {
        const folderElement = screen.getByText(/test-folder/i)
        expect(folderElement).toBeInTheDocument()
      })

      const folderButton = screen.getByText(/test-folder/i)
      fireEvent.click(folderButton)

      await waitFor(() => {
        expect(screen.getByText(/test-folder/i)).toBeInTheDocument()
        expect(screen.getByText('/')).toBeInTheDocument()
      })
    })

    it('navigates folder structure', async () => {
      const { navigateToFolder } = useFolder()
      render(<FileUpload {...defaultProps} />)
      
      await waitFor(() => {
        const folderElement = screen.getByText(/test-folder/i)
        expect(folderElement).toBeInTheDocument()
      })

      const folderButton = screen.getByText(/test-folder/i)
      fireEvent.click(folderButton)

      expect(navigateToFolder).toHaveBeenCalledWith('test-folder')

      const rootButton = screen.getByText('root')
      fireEvent.click(rootButton)

      expect(navigateToFolder).toHaveBeenCalledWith('root')
    })

    it('preserves folder structure after navigation', async () => {
      const { rerender } = render(<FileUpload {...defaultProps} />)
      
      await waitFor(() => {
        const folderElement = screen.getByText(/test-folder/i)
        expect(folderElement).toBeInTheDocument()
      })

      rerender(<FileUpload {...defaultProps} currentFolder="test-folder" />)

      await waitFor(() => {
        expect(screen.getByText(/test-folder/i)).toBeInTheDocument()
        expect(screen.getByText('/')).toBeInTheDocument()
      })
    })
  })

  describe('Upload Process', () => {
    it('renders dropzone with correct text', () => {
      render(<FileUpload />)
      
      expect(screen.getByText(/Drag & drop files here/i)).toBeInTheDocument()
      expect(screen.getByText(new RegExp(`Max size: ${UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`))).toBeInTheDocument()
    })

    it('validates file size', async () => {
      render(<FileUpload />)
      
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      Object.defineProperty(file, 'size', { value: UPLOAD_CONFIG.MAX_FILE_SIZE + 1 })
      
      const input = screen.getByTestId('file-input')
      fireEvent.change(input, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(/file size must not exceed/i)
      })
    })

    it('validates file type', async () => {
      render(<FileUpload />)
      
      const file = new File(['test'], 'test.invalid', { type: 'invalid/type' })
      
      const input = screen.getByTestId('file-input')
      fireEvent.change(input, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(/file type.*is not supported/i)
      })
    })

    it('prevents duplicate files', async () => {
      render(<FileUpload />)
      
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      
      const input = screen.getByTestId('file-input')
      fireEvent.change(input, { target: { files: [file] } })
      fireEvent.change(input, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(/file.*already exists/i)
      })
    })

    it('uploads files successfully', async () => {
      supabaseMock.uploadFile.mockResolvedValue({ path: 'test.txt' })
      
      render(<FileUpload />)
      
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      
      const input = screen.getByTestId('file-input')
      fireEvent.change(input, { target: { files: [file] } })
      
      const uploadButton = screen.getByTestId('upload-button')
      fireEvent.click(uploadButton)
      
      await waitFor(() => {
        expect(supabaseMock.uploadFile).toHaveBeenCalledWith(
          UPLOAD_CONFIG.UPLOAD_BUCKET,
          expect.stringContaining('test.txt'),
          file
        )
        expect(screen.getByTestId('file-item-0')).toHaveAttribute('variant', UPLOAD_STATES.SUCCESS)
      })
    })

    it('handles upload errors', async () => {
      const errorMessage = 'Upload failed'
      supabaseMock.uploadFile.mockRejectedValue(new Error(errorMessage))
      
      render(<FileUpload />)
      
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      
      const input = screen.getByTestId('file-input')
      fireEvent.change(input, { target: { files: [file] } })
      
      const uploadButton = screen.getByTestId('upload-button')
      fireEvent.click(uploadButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(/one or more files failed to upload/i)
        expect(screen.getByTestId('file-item-0')).toHaveAttribute('variant', UPLOAD_STATES.ERROR)
      })
    })

    it('removes files', async () => {
      render(<FileUpload />)
      
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      
      const input = screen.getByTestId('file-input')
      fireEvent.change(input, { target: { files: [file] } })
      
      const removeButton = screen.getByTestId('remove-file-0')
      fireEvent.click(removeButton)
      
      await waitFor(() => {
        expect(screen.queryByTestId('file-item-0')).not.toBeInTheDocument()
      })
    })

    it('clears all files', async () => {
      render(<FileUpload />)
      
      const files = [
        new File(['test1'], 'test1.txt', { type: 'text/plain' }),
        new File(['test2'], 'test2.txt', { type: 'text/plain' })
      ]
      
      const input = screen.getByTestId('file-input')
      fireEvent.change(input, { target: { files: files } })
      
      const clearButton = screen.getByTestId('clear-button')
      fireEvent.click(clearButton)
      
      await waitFor(() => {
        expect(screen.queryByTestId('file-item-0')).not.toBeInTheDocument()
        expect(screen.queryByTestId('file-item-1')).not.toBeInTheDocument()
      })
    })

    it('shows upload progress', async () => {
      supabaseMock.uploadFile.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ path: 'test.txt' }), 100)
      }))
      
      render(<FileUpload />)
      
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      
      const input = screen.getByTestId('file-input')
      fireEvent.change(input, { target: { files: [file] } })
      
      const uploadButton = screen.getByTestId('upload-button')
      fireEvent.click(uploadButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('progress-0')).toBeInTheDocument()
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('file-item-0')).toHaveAttribute('variant', UPLOAD_STATES.SUCCESS)
      })
    })
  })
}) 