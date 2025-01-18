import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { render, screen, fireEvent } from '@testing-library/react'
import ChatContainer from '../../src/components/ChatContainer'
import { mockSupabase } from '../setup/supabase.mock'
import { AuthProvider } from '../../src/contexts/AuthContext'

// Mock the WebSocket
const mockSendMessage = vi.fn()
const mockWebSocket = {
  send: mockSendMessage,
  close: vi.fn()
}

global.WebSocket = vi.fn(() => mockWebSocket)

// Mock useAuth hook
vi.mock('../../src/contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../src/contexts/AuthContext')
  return {
    ...actual,
    useAuth: () => ({
      user: { email: 'test@example.com' },
      loading: false
    })
  }
})

describe('ChatContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.from().select().mockResolvedValue({ data: [] })
  })

  it('should load messages on mount', async () => {
    const mockMessages = [
      { id: 1, content: 'Test message', username: 'test@example.com', channel: 'general' }
    ]

    mockSupabase.from().select().mockResolvedValueOnce({ data: mockMessages })

    render(
      <AuthProvider>
        <ChatContainer />
      </AuthProvider>
    )

    // Wait for messages to load
    const message = await screen.findByText('Test message')
    expect(message).toBeInTheDocument()
  })

  it('should send message and update UI', async () => {
    mockSupabase.from().insert().select().mockResolvedValueOnce({
      data: [{
        id: 1,
        content: 'New message',
        username: 'test@example.com',
        channel: 'general'
      }]
    })

    render(
      <AuthProvider>
        <ChatContainer />
      </AuthProvider>
    )

    // Type and send message
    const input = screen.getByTestId('message-input')
    const sendButton = screen.getByTestId('send-button')

    await act(async () => {
      fireEvent.change(input, { target: { value: 'New message' } })
      fireEvent.click(sendButton)
    })

    // Verify message was sent to Supabase
    expect(mockSupabase.from).toHaveBeenCalledWith('messages')
    expect(mockSupabase.from().insert).toHaveBeenCalled()

    // Verify WebSocket message was sent
    expect(mockSendMessage).toHaveBeenCalled()
    const sentMessage = JSON.parse(mockSendMessage.mock.calls[0][0])
    expect(sentMessage.content).toBe('New message')
  })

  it('should handle channel switching', async () => {
    const generalMessages = [{ id: 1, content: 'General message', channel: 'general' }]
    const randomMessages = [{ id: 2, content: 'Random message', channel: 'random' }]

    mockSupabase.from().select()
      .mockResolvedValueOnce({ data: generalMessages })
      .mockResolvedValueOnce({ data: randomMessages })

    render(
      <AuthProvider>
        <ChatContainer />
      </AuthProvider>
    )

    // Switch channel
    const channelSelect = screen.getByTestId('channel-select')
    
    await act(async () => {
      fireEvent.change(channelSelect, { target: { value: 'random' } })
    })

    // Verify messages were reloaded
    expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('channel', 'random')
  })

  it('should handle real-time updates', async () => {
    let subscriptionCallback
    mockSupabase.channel().on.mockImplementation((event, filter, callback) => {
      subscriptionCallback = callback
      return mockSupabase.channel()
    })

    render(
      <AuthProvider>
        <ChatContainer />
      </AuthProvider>
    )

    // Simulate real-time message
    const newMessage = {
      id: 3,
      content: 'Real-time message',
      username: 'other@example.com',
      channel: 'general'
    }

    await act(async () => {
      subscriptionCallback(newMessage)
    })

    // Verify message appears in UI
    const message = screen.getByText('Real-time message')
    expect(message).toBeInTheDocument()
  })
}) 