import { describe, it, expect, beforeAll } from 'vitest'
import { supabase, getMessages, sendMessage, onNewMessage } from '../supabaseClient'

describe('Chat Integration', () => {
  beforeAll(async () => {
    // Verify Supabase connection
    const { data, error } = await supabase
      .from('messages')
      .select('count')
      .single()
    
    if (error) throw new Error('Supabase connection failed')
  })

  it('should send and receive messages', async () => {
    const content = `Test message ${Date.now()}`
    
    // Send message
    const message = await sendMessage(content)
    expect(message.content).toBe(content)
    
    // Get messages
    const messages = await getMessages(1)
    expect(messages).toHaveLength(1)
    expect(messages[0].content).toBe(content)
  })

  it('should handle real-time updates', () => {
    return new Promise((resolve) => {
      const content = `Real-time test ${Date.now()}`
      
      // Subscribe to changes
      const subscription = onNewMessage((payload) => {
        expect(payload.new.content).toBe(content)
        subscription.unsubscribe()
        resolve()
      })

      // Send test message
      sendMessage(content)
    })
  })
}) 