import '@testing-library/jest-dom'
import { expect, afterEach, vi, beforeAll, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { configure } from '@testing-library/react'
import { act } from 'react'
import { TextEncoder, TextDecoder } from 'util'

// Configure React Testing Library with proper async handling
configure({
  asyncUtilTimeout: 30000,
  eventWrapper: async (cb) => {
    let result
    await act(async () => {
      result = await cb()
    })
    return result
  }
})

// Configure React testing environment for act()
global.IS_REACT_ACT_ENVIRONMENT = true

// Configure requestAnimationFrame with proper timing
global.requestAnimationFrame = (callback) => {
  return setTimeout(() => {
    callback(Date.now())
  }, 16) // Use 16ms for 60fps simulation
}

// Configure cancelAnimationFrame
global.cancelAnimationFrame = (id) => {
  clearTimeout(id)
}

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers)

// Configure global objects
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock localStorage with async behavior
const localStorageMock = {
  store: new Map(),
  getItem: vi.fn((key) => {
    return Promise.resolve(localStorageMock.store.get(key) || null)
  }),
  setItem: vi.fn((key, value) => {
    return Promise.resolve(localStorageMock.store.set(key, value))
  }),
  removeItem: vi.fn((key) => {
    return Promise.resolve(localStorageMock.store.delete(key))
  }),
  clear: vi.fn(() => {
    return Promise.resolve(localStorageMock.store.clear())
  }),
}
global.localStorage = localStorageMock

// Mock fetch
global.fetch = vi.fn()

// Configure Vitest
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => ({
      auth: {
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn(),
        onAuthStateChange: vi.fn((callback) => {
          callback('SIGNED_IN', { session: null })
          return { data: { subscription: { unsubscribe: vi.fn() } } }
        }),
      },
    }),
  }
})

// Configure testing environment
beforeAll(() => {
  // Reset all mocks
  vi.clearAllMocks()
  
  // Configure longer timeout for async tests
  vi.setConfig({ testTimeout: 10000 })
})

beforeEach(() => {
  // Clear localStorage
  localStorageMock.store.clear()
  
  // Reset fetch mock
  global.fetch.mockReset()
})

afterEach(() => {
  // Clean up any mounted components
  cleanup()
  
  // Clear all mocks
  vi.clearAllMocks()
})

afterAll(() => {
  vi.clearAllTimers()
})

// Mock Portal container with proper cleanup
const portalRoot = document.createElement('div')
portalRoot.setAttribute('id', 'chakra-portal')
document.body.appendChild(portalRoot)

// Mock WebSocket with proper async behavior and cleanup
class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = WebSocket.OPEN
    this.onmessage = null
    this.onopen = null
    this.onclose = null
    this.onerror = null

    setTimeout(() => {
      if (this.onopen) {
        act(() => {
          this.onopen()
        })
      }
    }, 16)
  }

  send(data) {
    setTimeout(() => {
      if (this.onmessage) {
        act(() => {
          this.onmessage({ data })
        })
      }
    }, 16)
  }

  close() {
    setTimeout(() => {
      if (this.onclose) {
        act(() => {
          this.onclose()
        })
      }
    }, 16)
  }
}

MockWebSocket.CONNECTING = 0
MockWebSocket.OPEN = 1
MockWebSocket.CLOSING = 2
MockWebSocket.CLOSED = 3

global.WebSocket = MockWebSocket 