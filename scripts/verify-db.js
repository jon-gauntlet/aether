import { supabase } from '../src/lib/supabaseClient'
import { logger } from '../src/lib/logger'

async function verifyDatabase() {
  console.log('🔍 Verifying database setup...')

  try {
    // Run complete verification
    const { data: verification, error: verifyError } = await supabase
      .rpc('verify_complete_setup')
    
    if (verifyError) throw verifyError
    console.log('✅ Complete setup verification successful:')
    Object.entries(verification).forEach(([key, value]) => {
      console.log(`  ✓ ${key}: ${JSON.stringify(value)}`)
    })

    // Test realtime subscription
    const channel = supabase.channel('test')
    await channel.subscribe()
    console.log('✅ Realtime subscription working')

    // Test message insertion
    const testMessage = { content: 'DB Verification Test' }
    const { error: insertError } = await supabase
      .from('messages')
      .insert([testMessage])

    if (insertError) throw insertError
    console.log('✅ Message insertion working')

    // Cleanup test message
    await supabase
      .from('messages')
      .delete()
      .eq('content', testMessage.content)

    await supabase.removeChannel(channel)

    console.log('\n✨ Database verification complete!')
    return true

  } catch (error) {
    logger.error('Database verification failed', error)
    console.error('❌ Database verification failed:', error.message)
    console.error('Details:', error)
    process.exit(1)
  }
}

// Execute verification
verifyDatabase()
  .catch(error => {
    logger.error('Verification failed', error)
    process.exit(1)
  }) 