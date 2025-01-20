import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { expect, afterEach } from 'vitest'

// Extend Vitest's expect with Testing Library's matchers
expect.extend(matchers)

// Lightweight WebSocket mock
global.WebSocket = class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = 1 // OPEN
  }
  send() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
}

// Minimal console mock
const originalError = console.error
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Warning:')) return
  originalError.call(console, ...args)
}

// Minimal observer mocks
global.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Minimal matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  value: () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {}
  })
})

// Minimal localStorage mock
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
})

// Minimal fetch mock
global.fetch = vi.fn()

// Efficient cleanup
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Disable console error in tests
vi.spyOn(console, 'error').mockImplementation(() => {})

// Global error handler
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error:', { message, source, lineno, colno, error })
}

// Console error spy
const consoleSpy = vi.spyOn(console, 'error')
consoleSpy.mockImplementation((message, ...args) => {
  // Ignore specific React warnings in tests
  if (
    message?.includes('React does not recognize the') ||
    message?.includes('Invalid DOM property')
  ) {
    return
  }
  console.warn('Console error in test:', message, ...args)
}) 