import React from 'react'
import { render } from '@testing-library/react'
import { ThemeProvider } from '../theme/ThemeProvider'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

// Custom render with theme provider
export function renderWithTheme(ui, options = {}) {
  const { theme = 'light', ...rest } = options

  return {
    user: userEvent.setup(),
    ...render(ui, {
      wrapper: ({ children }) => (
        <ThemeProvider initialTheme={theme}>
          {children}
        </ThemeProvider>
      ),
      ...rest,
    }),
  }
}

// Mock theme hook
export const mockUseTheme = (theme = 'light') => {
  const useThemeMock = vi.fn().mockReturnValue({
    isDark: theme === 'dark',
    theme: {
      colors: {
        primary: { 500: '#0967D2' },
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          800: '#1E293B',
          900: '#0F172A'
        }
      },
      spacing: {
        1: '0.25rem',
        2: '0.5rem',
        4: '1rem'
      },
      typography: {
        fonts: {
          body: 'Inter, system-ui, -apple-system, sans-serif'
        },
        fontSizes: {
          sm: '0.875rem',
          md: '1rem'
        }
      }
    },
    toggleTheme: vi.fn()
  })
  return useThemeMock
}

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

// Mock file
export const createTestFile = (name = 'test.txt', type = 'text/plain', size = 1024) => {
  return new File(['test content'], name, { type })
}

// Mock drag event
export const createDragEvent = (type, files = [createTestFile()]) => {
  const event = new Event(type, { bubbles: true })
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      files,
      items: files.map(file => ({
        kind: 'file',
        type: file.type,
        getAsFile: () => file
      })),
      types: ['Files']
    }
  })
  return event
}

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