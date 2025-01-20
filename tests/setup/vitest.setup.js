import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { handlers } from '../mocks/handlers'

// Setup MSW
export const server = setupServer(...handlers)

// Setup global mocks
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

global.fetch = vi.fn()
global.WebSocket = vi.fn()

// Run before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

// Run before each test
beforeEach(() => {
  // Reset fetch mocks
  global.fetch.mockClear()
  
  // Reset WebSocket mocks
  global.WebSocket.mockClear()
  
  // Reset any runtime handlers
  server.resetHandlers()
})

// Run after each test
afterEach(() => {
  cleanup()
})

// Run after all tests
afterAll(() => {
  server.close()
}) 