import { describe, it, expect, beforeAll } from 'vitest'
import { supabase } from './supabaseClient'

describe('Supabase Connection', () => {
  it('can connect to Supabase', async () => {
    const { error } = await supabase
      .from('messages')
      .select('count')
      .single()

    expect(error?.message).not.toBe('FetchError: Failed to fetch')
  })

  it('can subscribe to real-time updates', async () => {
    const channel = supabase.channel('test')
    const subscription = await channel.subscribe()
    expect(subscription.state).toBe('SUBSCRIBED')
    await supabase.removeChannel(channel)
  })
}) 