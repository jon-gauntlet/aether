import { createClient } from 'redis'
import { MeiliSearch } from 'meilisearch'
import pg from 'pg'

async function testServices() {
  console.log('🚀 Testing services...\n')

  // Test Redis
  try {
    console.log('Testing Redis connection...')
    const redis = createClient({ url: 'redis://localhost:6379' })
    await redis.connect()
    await redis.ping()
    console.log('✅ Redis connection successful\n')
    await redis.quit()
  } catch (error) {
    console.error('❌ Redis connection failed:', error, '\n')
  }

  // Test Meilisearch
  try {
    console.log('Testing Meilisearch connection...')
    const meili = new MeiliSearch({ host: 'http://localhost:7700' })
    const health = await meili.health()
    console.log('✅ Meilisearch connection successful:', health, '\n')
  } catch (error) {
    console.error('❌ Meilisearch connection failed:', error, '\n')
  }

  // Test PostgreSQL
  try {
    console.log('Testing PostgreSQL connection...')
    const client = new pg.Client('postgresql://postgres:postgres@localhost:5432/ai_lms')
    await client.connect()
    const result = await client.query('SELECT NOW()')
    console.log('✅ PostgreSQL connection successful:', result.rows[0], '\n')
    await client.end()
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error, '\n')
  }
}

testServices() 