import { createClient } from '@supabase/supabase-js'
import { logger } from '../src/lib/logger.js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  logger.error('Missing Supabase credentials in environment')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifySetup() {
  try {
    logger.info('Verifying Supabase connection...')
    
    // Test database connection and message operations
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .limit(1)
    
    if (error) throw error
    logger.info('Database connection verified')

    // Test realtime subscription
    const channel = supabase.channel('messages')
    channel.subscribe(status => {
      if (status === 'SUBSCRIBED') {
        logger.info('Realtime subscription verified')
        channel.unsubscribe()
        process.exit(0)
      }
    })

  } catch (error) {
    logger.error('Verification failed', error)
    process.exit(1)
  }
}

verifySetup() 