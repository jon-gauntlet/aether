import { describe, it, expect, beforeEach, vi } from 'vitest'
import { supabase } from '../../src/lib/supabaseClient'

// Mock Supabase client
vi.mock('../../src/lib/supabaseClient', () => {
  const mockSelect = vi.fn()
  const mockOrder = vi.fn()
  const mockLimit = vi.fn()
  const mockDelete = vi.fn()
  const mockEq = vi.fn()
  const mockInsert = vi.fn()

  return {
    supabase: {
      from: vi.fn(() => ({
        insert: (...args) => {
          mockInsert(...args)
          return { data: null, error: null }
        },
        select: (...args) => {
          mockSelect(...args)
          return {
            order: (...args) => {
              mockOrder(...args)
              return {
                limit: (...args) => {
                  mockLimit(...args)
                  return { data: [], error: null }
                }
              }
            }
          }
        },
        delete: () => ({
          eq: (...args) => {
            mockEq(...args)
            return { data: null, error: null }
          }
        })
      })),
      channel: vi.fn(() => ({
        on: vi.fn(() => ({
          subscribe: vi.fn()
        }))
      }))
    }
  }
})

describe('Supabase Data Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Messages', () => {
    it('should save messages to database', async () => {
      const message = {
        content: 'Test message',
        user_id: 'test-user',
        channel: 'general'
      }

      const { error } = await supabase
        .from('messages')
        .insert([message])

      expect(error).toBeNull()
    })

    it('should retrieve messages from database', async () => {
      const mockMessages = [
        { id: 1, content: 'Message 1', user_id: 'user1' },
        { id: 2, content: 'Message 2', user_id: 'user2' }
      ]

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      expect(error).toBeNull()
      expect(data).toEqual([])
    })

    it('should handle message deletion', async () => {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', '123')

      expect(error).toBeNull()
    })
  })

  describe('Real-time Subscriptions', () => {
    it('should subscribe to message updates', () => {
      const mockOn = vi.fn().mockReturnThis()
      const mockSubscribe = vi.fn()
      
      supabase.channel.mockReturnValueOnce({
        on: mockOn,
        subscribe: mockSubscribe
      })

      const channel = supabase
        .channel('messages')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages' 
        }, () => {})
        .subscribe()

      expect(mockOn).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        expect.any(Function)
      )
      expect(mockSubscribe).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      const mockError = { message: 'Database error' }
      const mockInsert = vi.fn().mockResolvedValueOnce({ data: null, error: mockError })
      
      supabase.from.mockReturnValueOnce({ insert: mockInsert })

      const { error } = await supabase
        .from('messages')
        .insert([{ content: 'Test' }])

      expect(error).toEqual(mockError)
    })

    it('should handle network errors', async () => {
      const mockSelect = vi.fn().mockRejectedValueOnce(new Error('Network error'))
      
      supabase.from.mockReturnValueOnce({ select: mockSelect })

      await expect(
        supabase.from('messages').select('*')
      ).rejects.toThrow('Network error')
    })
  })
}) 