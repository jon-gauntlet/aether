import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { supabase } from '../supabaseClient'

describe('Chat Integration', () => {
  beforeAll(async () => {
    // Clear messages before tests
    await supabase.from('messages').delete().neq('id', '')
  })

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('messages').delete().neq('id', '')
  })

  it('should send and receive messages', async () => {
    // Send test message
    const { error: sendError } = await supabase
      .from('messages')
      .insert([{ content: 'Test message' }])
    
    expect(sendError).toBeNull()

    // Verify message was saved
    const { data, error: readError } = await supabase
      .from('messages')
      .select('*')
      .eq('content', 'Test message')
      .single()
    
    expect(readError).toBeNull()
    expect(data.content).toBe('Test message')
  })

  it('should handle realtime updates', async () => {
    return new Promise(async (resolve) => {
      // Subscribe to changes
      const channel = supabase.channel('messages')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            expect(payload.new.content).toBe('Realtime test')
            channel.unsubscribe()
            resolve()
          }
        )
        .subscribe()

      // Insert test message
      await supabase
        .from('messages')
        .insert([{ content: 'Realtime test' }])
    })
  })
}) 