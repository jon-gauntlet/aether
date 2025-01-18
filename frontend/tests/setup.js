import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Extend expect
expect.extend({})

// Clean up after each test
afterEach(() => {
  cleanup()
})

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