export const mockMessages = [
  {
    id: 'msg1',
    content: 'Hello world',
    username: 'test@example.com',
    timestamp: '2024-01-18T22:00:00.000Z',
    channel: 'general'
  },
  {
    id: 'msg2',
    content: 'How are you?',
    username: 'other@example.com',
    timestamp: '2024-01-18T22:01:00.000Z',
    channel: 'general'
  }
]

export const mockChannels = ['general', 'random', 'support']

export const mockUsers = [
  {
    email: 'test@example.com',
    name: 'Test User'
  },
  {
    email: 'other@example.com',
    name: 'Other User'
  }
]

export const mockAuthResponses = {
  success: {
    ok: true,
    json: async () => ({
      user: { email: 'test@example.com' },
      session: { token: 'test-token' }
    })
  },
  failure: {
    ok: false,
    json: async () => ({
      error: 'Invalid credentials'
    })
  },
  networkError: {
    ok: false,
    json: async () => {
      throw new Error('Network error')
    }
  }
} 