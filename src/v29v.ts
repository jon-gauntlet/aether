import { redis } from '../lib/redis'

async function testRedis() {
  try {
    console.log('Testing Redis connection...')
    await redis.ping()
    console.log('✅ Redis connection successful')
    process.exit(0)
  } catch (error) {
    console.error('❌ Redis connection failed:', error)
    process.exit(1)
  }
}

testRedis() 