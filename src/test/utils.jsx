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