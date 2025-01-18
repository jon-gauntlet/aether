import { vi } from 'vitest'

const mockMessages = [
  { id: 1, content: 'Test message 1', sender: 'user' },
  { id: 2, content: 'Test message 2', sender: 'assistant' }
]

export const useQuery = vi.fn(() => ({
  data: mockMessages,
  isLoading: false,
  error: null
}))

export const useMutation = vi.fn(() => ({
  mutate: vi.fn(),
  isLoading: false,
  error: null
}))

export const sendMessage = vi.fn()
export const subscribeToMessages = vi.fn()

vi.mock('../api/client', () => ({
  useQuery,
  useMutation,
  sendMessage,
  subscribeToMessages
})) 