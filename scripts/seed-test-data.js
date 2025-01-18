import { supabase } from '../src/lib/supabaseClient'
import { logger } from '../src/lib/logger'

async function seedTestData() {
  console.log('🌱 Seeding test data...')

  try {
    // Clear existing data
    await supabase.from('messages').delete().neq('id', '')
    
    // Create test messages
    const messages = [
      { content: 'Welcome to the chat!' },
      { content: 'This is a test message' },
      { content: 'Feel free to start chatting' }
    ]

    const { error } = await supabase
      .from('messages')
      .insert(messages)

    if (error) throw error
    console.log('✅ Test data seeded successfully')

  } catch (error) {
    console.error('❌ Failed to seed test data:', error.message)
    process.exit(1)
  }
}

seedTestData() 