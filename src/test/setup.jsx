import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { expect } from 'vitest'

// Extend expect with jest-dom matchers
expect.extend(matchers)

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock window.matchMedia
global.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

// Store original console methods
const originalError = console.error
const originalWarn = console.warn

// Override console.error to be less strict in tests
console.error = (...args) => {
  // Ignore certain React warnings
  if (args[0]?.includes?.('Warning:')) return
  if (args[0]?.includes?.('defaultProps')) return
  originalError(...args)
}

// Override console.warn to be less strict in tests
console.warn = (...args) => {
  // Ignore certain React warnings
  if (args[0]?.includes?.('Warning:')) return
  originalWarn(...args)
}

// Mock fetch
global.fetch = vi.fn()

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
}) 