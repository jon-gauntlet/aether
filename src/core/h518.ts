import { redis } from '../lib/redis'

async function testRedis() {
  try {
    console.log('Testing Redis connection...')
    const testKey = 'test-connection'
    await redis.set(testKey, 'success')
    const result = await redis.get(testKey)
    await redis.del(testKey)
    
    if (result === 'success') {
      console.log('✅ Redis connection successful')
      process.exit(0)
    } else {
      throw new Error('Redis test failed')
    }
  } catch (error) {
    console.error('❌ Redis connection failed:', error)
    process.exit(1)
  }
}

testRedis() 