import { supabase } from '../src/lib/supabaseClient'
import { logger } from '../src/lib/logger'
import { testUtils } from '../src/lib/test-utils'

async function verifySetup() {
  console.log('🔍 Starting setup verification...')

  try {
    // Test database connection
    console.log('\nTesting database connection...')
    const { data, error } = await supabase
      .from('messages')
      .select('count')
      .single()

    if (error) throw error
    console.log('✅ Database connection successful')

    // Test message operations
    console.log('\nTesting message operations...')
    await testUtils.clearMessages()
    const message = await testUtils.createTestMessage()
    console.log('✅ Message operations successful')

    // Test realtime
    console.log('\nTesting realtime subscription...')
    const channel = supabase.channel('test')
    await channel.subscribe()
    console.log('✅ Realtime subscription successful')
    
    // Cleanup
    await testUtils.clearMessages()
    await supabase.removeChannel(channel)

    console.log('\n✨ All verifications passed!')

  } catch (error) {
    console.error('\n❌ Setup verification failed:', error.message)
    process.exit(1)
  }
}

verifySetup() 