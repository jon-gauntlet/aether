import { describe, it, expect } from 'vitest'
import { supabase } from '../supabaseClient'

describe('Supabase Connection', () => {
  it('should connect to Supabase', async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .limit(1)
    
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  })
}) 