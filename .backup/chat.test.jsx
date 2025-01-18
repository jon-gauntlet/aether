import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatContainer } from '../../src/components/ChatContainer'
import { mockSupabase } from '../setup/supabase.mock'

// Mock the WebSocket
const mockSendMessage = vi.fn()
const mockWebSocket = {
  send: mockSendMessage,
  close: vi.fn()
}

global.WebSocket = vi.fn(() => mockWebSocket)

// Mock Supabase
vi.mock('../../../shared/utils/supabase', () => ({
  supabase: mockSupabase
}))

// Mock useAuth hook
vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    loading: false
  })
}))

describe('ChatContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders chat container with messages', () => {
    const messages = [
      { id: '1', content: 'Test message', author: 'User 1', timestamp: new Date(), reactions: [] }
    ]

    render(<ChatContainer messages={messages} onSendMessage={vi.fn()} onReact={vi.fn()} />)
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('handles sending messages', () => {
    const onSendMessage = vi.fn()
    render(<ChatContainer messages={[]} onSendMessage={onSendMessage} onReact={vi.fn()} />)

    const input = screen.getByPlaceholderText('Type a message...')
    fireEvent.change(input, { target: { value: 'New message' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onSendMessage).toHaveBeenCalledWith('New message')
  })

  it('handles reactions', () => {
    const onReact = vi.fn()
    const messages = [
      { 
        id: '1', 
        content: 'Test message', 
        author: 'User 1', 
        timestamp: new Date(),
        reactions: [{ emoji: '👍', count: 1 }]
      }
    ]

    render(<ChatContainer messages={messages} onSendMessage={vi.fn()} onReact={onReact} />)
    
    const reactionButton = screen.getByTestId('reaction-👍')
    fireEvent.click(reactionButton)

    expect(onReact).toHaveBeenCalledWith('👍', '1')
  })
}) 