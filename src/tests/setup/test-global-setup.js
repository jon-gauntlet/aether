import { supabase } from './supabaseClient'
import { logger } from './logger'

export async function setup() {
  try {
    // Verify database connection
    const { error } = await supabase
      .from('messages')
      .select('count')
      .single()

    if (error) throw error
    logger.debug('Test database connection verified')

  } catch (error) {
    logger.error('Global test setup failed', error)
    throw error
  }
}

export async function teardown() {
  // Add global teardown if needed
} 