import { supabase } from './supabaseClient'
import { logger } from './logger'

export const testUtils = {
  async clearMessages() {
    try {
      await supabase.from('messages').delete().neq('id', '')
      logger.debug('Test messages cleared')
    } catch (error) {
      logger.error('Failed to clear test messages', error)
      throw error
    }
  },

  async createTestMessage(content = 'Test message') {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{ content }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      logger.error('Failed to create test message', error)
      throw error
    }
  },

  async waitForRealtimeEvent(eventType, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Realtime event timeout'))
      }, timeout)

      const channel = supabase.channel('test')
        .on('postgres_changes',
          { event: eventType, schema: 'public', table: 'messages' },
          (payload) => {
            clearTimeout(timer)
            channel.unsubscribe()
            resolve(payload)
          }
        )
        .subscribe()
    })
  },

  async createTestMessages(count = 3) {
    const messages = Array.from({ length: count }, (_, i) => ({
      content: `Test message ${i + 1}`
    }))

    const { data, error } = await supabase
      .from('messages')
      .insert(messages)
      .select()

    if (error) throw error
    return data
  }
} 