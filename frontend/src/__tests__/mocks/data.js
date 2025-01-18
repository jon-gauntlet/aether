// Mock messages
export const mockMessages = [
  {
    id: 1,
    content: 'Test message 1',
    role: 'user',
    timestamp: '2024-01-18T12:00:00Z',
  },
  {
    id: 2,
    content: 'Test message 2',
    role: 'assistant',
    timestamp: '2024-01-18T12:01:00Z',
  },
];

// Mock users
export const mockUsers = [
  {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
  },
  {
    id: 2,
    name: 'Another User',
    email: 'another@example.com',
  },
];

// Mock API responses
export const mockApiResponses = {
  messages: {
    success: { data: mockMessages, error: null },
    error: { data: null, error: 'Failed to load messages' },
  },
  users: {
    success: { data: mockUsers, error: null },
    error: { data: null, error: 'Failed to load users' },
  },
};

// Mock functions
export const mockFunctions = {
  sendMessage: vi.fn().mockResolvedValue({ id: 3, content: 'New message', role: 'user' }),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}; 