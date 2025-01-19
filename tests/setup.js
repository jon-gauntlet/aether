import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers)

// Clean up after each test
afterEach(() => {
  cleanup()
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = localStorageMock

// Mock window.URL
const mockCreateObjectURL = vi.fn()
const mockRevokeObjectURL = vi.fn()
global.URL.createObjectURL = mockCreateObjectURL
global.URL.revokeObjectURL = mockRevokeObjectURL

// Mock fetch
global.fetch = vi.fn()

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock matchMedia
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

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = WebSocket.OPEN
    this.onmessage = null
    this.onopen = null
    this.onclose = null
    this.onerror = null

    // Auto trigger onopen
    setTimeout(() => {
      if (this.onopen) this.onopen()
    }, 0)
  }

  send(data) {
    // Mock echo behavior
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data })
      }
    }, 0)
  }

  close() {
    if (this.onclose) this.onclose()
  }
}

// Add WebSocket constants
MockWebSocket.CONNECTING = 0
MockWebSocket.OPEN = 1
MockWebSocket.CLOSING = 2
MockWebSocket.CLOSED = 3

global.WebSocket = MockWebSocket

// Mock Supabase client for tests
vi.mock('../src/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(() => Promise.resolve({
        data: null,
        error: null
      })),
      signOut: vi.fn(() => Promise.resolve({
        error: null
      })),
      getSession: vi.fn(() => Promise.resolve({
        data: { session: null },
        error: null
      })),
      onAuthStateChange: vi.fn((callback) => {
        // Store callback for later use in tests
        global.authCallback = callback
        return {
          data: { subscription: { unsubscribe: vi.fn() } }
        }
      })
    }
  }
})) 