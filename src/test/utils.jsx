import React from 'react'
import { render } from '@testing-library/react'
import { ThemeProvider } from 'styled-components'
import { AuthProvider } from '../components/Auth/AuthProvider'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { mockTheme } from './mocks'

// Custom render with theme and auth providers
export const renderWithTheme = (ui, { withAuth = false } = {}) => {
  const Wrapper = ({ children }) => (
    <ThemeProvider theme={mockTheme}>
      {withAuth ? <AuthProvider>{children}</AuthProvider> : children}
    </ThemeProvider>
  )

  return {
    ...render(ui, { wrapper: Wrapper }),
    user: userEvent.setup()
  }
}

// Mock theme hook
export const mockUseTheme = () => ({
  theme: {
    colors: {
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
      },
      neutral: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
      },
      success: {
        50: '#f0fdf4',
        500: '#22c55e',
        700: '#15803d',
      },
      error: {
        50: '#fef2f2',
        500: '#ef4444',
        700: '#b91c1c',
      },
      warning: {
        50: '#fffbeb',
        500: '#f59e0b',
        700: '#b45309',
      },
      background: '#ffffff',
      text: '#0f172a',
    },
    typography: {
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      lineHeight: {
        none: 1,
        tight: 1.25,
        snug: 1.375,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2,
      },
    },
    spacing: {
      0: '0',
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      8: '2rem',
      10: '2.5rem',
      12: '3rem',
      16: '4rem',
    },
    borderRadius: {
      none: '0',
      sm: '0.125rem',
      base: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      full: '9999px',
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    },
    transitions: {
      base: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
      smooth: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
      slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  isDark: false,
  toggleTheme: jest.fn(),
})

// Mock styled-components
export const mockStyled = {
  button: vi.fn().mockReturnValue('button'),
  div: vi.fn().mockReturnValue('div'),
  span: vi.fn().mockReturnValue('span')
}

// Mock component props
export const createTestProps = (props = {}) => ({
  onClick: vi.fn(),
  className: 'test-class',
  children: 'Test Content',
  ...props
})

// Wait for animations
export const waitForAnimations = () => 
  new Promise(resolve => setTimeout(resolve, 300))

// Mock intersection observer entries
export const createIntersectionObserverEntry = (isIntersecting = true) => ({
  isIntersecting,
  boundingClientRect: {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 100,
    height: 100
  },
  intersectionRatio: isIntersecting ? 1 : 0,
  intersectionRect: isIntersecting ? {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 100,
    height: 100
  } : {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 0,
    height: 0
  },
  rootBounds: {
    top: 0,
    left: 0,
    bottom: 100,
    right: 100,
    width: 100,
    height: 100
  },
  target: document.createElement('div'),
  time: Date.now()
})

// Mock resize observer entry
export const createResizeObserverEntry = (width = 100, height = 100) => ({
  contentRect: {
    width,
    height,
    top: 0,
    left: 0,
    bottom: height,
    right: width
  },
  target: document.createElement('div')
})

// Mock error boundary
export class TestErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Test Error Boundary: {this.state.error.message}</div>
    }
    return this.props.children
  }
}

// Mock file with custom size and content
export const createTestFile = (name = 'test.txt', type = 'text/plain', size = 1024, content = null) => {
  const fileContent = content || new Array(size).fill('a').join('')
  const file = new File([fileContent], name, { type })
  
  // Add custom size property for testing
  Object.defineProperty(file, 'size', {
    value: size,
    configurable: true
  })

  // Add preview URL for images
  if (type.startsWith('image/')) {
    Object.defineProperty(file, 'preview', {
      value: URL.createObjectURL(file),
      configurable: true
    })
  }

  return file
}

// Create multiple test files
export const createTestFiles = (count = 3, options = {}) => {
  const defaults = {
    namePrefix: 'test',
    type: 'text/plain',
    size: 1024,
    content: null
  }
  const config = { ...defaults, ...options }

  return Array.from({ length: count }, (_, i) => 
    createTestFile(
      `${config.namePrefix}${i + 1}${getExtensionFromType(config.type)}`,
      config.type,
      config.size,
      config.content
    )
  )
}

// Get file extension from mime type
export const getExtensionFromType = (type) => {
  const extensions = {
    'text/plain': '.txt',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif'
  }
  return extensions[type] || ''
}

// Enhanced drag event creator with more options
export const createDragEvent = (type, files = [createTestFile()], options = {}) => {
  const defaults = {
    bubbles: true,
    cancelable: true,
    composed: true
  }
  const config = { ...defaults, ...options }

  const event = new Event(type, config)
  
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      files,
      items: files.map(file => ({
        kind: 'file',
        type: file.type,
        getAsFile: () => file
      })),
      types: ['Files'],
      setData: vi.fn(),
      getData: vi.fn(),
      clearData: vi.fn(),
      setDragImage: vi.fn()
    }
  })

  return event
}

// Mock upload progress event
export const createUploadProgressEvent = (loaded, total) => ({
  lengthComputable: true,
  loaded,
  total
})

// Mock XMLHttpRequest for upload testing
export const mockXHR = () => {
  const xhrMock = {
    open: vi.fn(),
    send: vi.fn(),
    setRequestHeader: vi.fn(),
    upload: {
      addEventListener: vi.fn()
    },
    readyState: 4,
    status: 200,
    response: '{"success": true}',
    responseText: '{"success": true}',
    onload: null,
    onerror: null,
    onabort: null,
    onprogress: null
  }

  window.XMLHttpRequest = vi.fn(() => xhrMock)
  return xhrMock
}

// Mock FormData for testing file uploads
export const mockFormData = () => {
  const store = new Map()
  
  class MockFormData {
    append(key, value) {
      store.set(key, value)
    }
    get(key) {
      return store.get(key)
    }
    has(key) {
      return store.has(key)
    }
    delete(key) {
      store.delete(key)
    }
    entries() {
      return store.entries()
    }
    values() {
      return store.values()
    }
    keys() {
      return store.keys()
    }
  }

  window.FormData = MockFormData
  return store
}

// Wait for file processing (e.g. preview generation)
export const waitForFileProcessing = () => 
  new Promise(resolve => setTimeout(resolve, 100))

// Mock form data
export const createTestFormData = (data = {}) => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value)
  })
  return formData
}

// Mock response
export const createTestResponse = (data = {}, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

// Test IDs
export const testIds = {
  button: 'test-button',
  input: 'test-input',
  form: 'test-form',
  error: 'test-error',
  loading: 'test-loading',
  success: 'test-success'
}

export const TestWrapper = ({ children }) => (
  <AuthProvider>
    <ThemeProvider theme={mockTheme}>
      {children}
    </ThemeProvider>
  </AuthProvider>
)

export const renderWithProviders = (ui, options = {}) => {
  const wrapper = ({ children }) => (
    <TestWrapper>
      {children}
    </TestWrapper>
  )
  return render(ui, { wrapper, ...options })
} 