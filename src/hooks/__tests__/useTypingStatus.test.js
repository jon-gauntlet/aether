import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useTypingStatus } from '../useTypingStatus'
import { supabase } from '../../utils/supabase'
import { useAuth } from '../../contexts/AuthContext'

// Mock supabase
vi.mock('../../utils/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      send: vi.fn().mockResolvedValue({}),
      subscribe: vi.fn().mockReturnThis()
    })),
    removeChannel: vi.fn()
  }
}))

// Mock auth context
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}))

describe('useTypingStatus', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: mockUser })
  })

  it('initializes with empty typing users', () => {
    const { result } = renderHook(() => useTypingStatus())
    expect(result.current.typingUsers).toEqual({})
    expect(result.current.getTypingMessage()).toBe('')
  })

  it('sets up supabase channel subscription', () => {
    renderHook(() => useTypingStatus())
    expect(supabase.channel).toHaveBeenCalledWith('typing_status')
  })

  it('broadcasts typing status', async () => {
    const { result } = renderHook(() => useTypingStatus())
    
    await act(async () => {
      await result.current.broadcastTypingStatus()
    })

    expect(supabase.channel().send).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: mockUser.id,
        user_email: mockUser.email,
        is_typing: true
      }
    })
  })

  it('formats typing message correctly', () => {
    const { result } = renderHook(() => useTypingStatus())
    
    // Simulate receiving typing status updates
    act(() => {
      const channel = supabase.channel()
      const onTyping = channel.on.mock.calls[0][1]
      
      // One user typing
      onTyping({
        payload: {
          payload: {
            user_id: 'user-2',
            user_email: 'user2@example.com',
            is_typing: true
          }
        }
      })
    })
    expect(result.current.getTypingMessage()).toBe('user2@example.com is typing...')

    // Two users typing
    act(() => {
      const channel = supabase.channel()
      const onTyping = channel.on.mock.calls[0][1]
      
      onTyping({
        payload: {
          payload: {
            user_id: 'user-3',
            user_email: 'user3@example.com',
            is_typing: true
          }
        }
      })
    })
    expect(result.current.getTypingMessage()).toBe('user2@example.com and user3@example.com are typing...')

    // Three users typing
    act(() => {
      const channel = supabase.channel()
      const onTyping = channel.on.mock.calls[0][1]
      
      onTyping({
        payload: {
          payload: {
            user_id: 'user-4',
            user_email: 'user4@example.com',
            is_typing: true
          }
        }
      })
    })
    expect(result.current.getTypingMessage()).toBe('3 people are typing...')
  })

  it('removes typing status after timeout', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useTypingStatus())
    
    // Add typing user
    act(() => {
      const channel = supabase.channel()
      const onTyping = channel.on.mock.calls[0][1]
      
      onTyping({
        payload: {
          payload: {
            user_id: 'user-2',
            user_email: 'user2@example.com',
            is_typing: true
          }
        }
      })
    })
    expect(result.current.getTypingMessage()).toBe('user2@example.com is typing...')

    // Fast forward past timeout
    act(() => {
      vi.advanceTimersByTime(3100)
    })
    expect(result.current.getTypingMessage()).toBe('')

    vi.useRealTimers()
  })

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useTypingStatus())
    unmount()
    expect(supabase.removeChannel).toHaveBeenCalled()
  })
}) 