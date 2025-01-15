import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { configure } from '@testing-library/react'
import { cleanup } from '@testing-library/react'

// Configure testing-library for headless operation
configure({
  testIdAttribute: 'data-testid',
  computedStyleSupportsPseudoElements: false,
  // Disable transitions/animations
  defaultHidden: true
})

// Clean up after each test
afterEach(() => {
  cleanup()
})

expect.extend({
  toBeInRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      }
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      }
    }
  },
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
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

// Mock ResizeObserver
window.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock requestAnimationFrame
window.requestAnimationFrame = vi.fn((callback) => setTimeout(callback, 0))
window.cancelAnimationFrame = vi.fn((id) => clearTimeout(id))

// Suppress React 18 warnings
const originalError = console.error
console.error = (...args) => {
  if (args[0]?.includes('ReactDOM.render is no longer supported')) return
  if (args[0]?.includes('ReactDOMTestUtils.act')) return
  originalError(...args)
} 