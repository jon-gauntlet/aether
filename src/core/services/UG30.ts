import { redis } from '../lib/redis'
import client from '../lib/meilisearch'
import { PrismaClient } from '@prisma/client'

async function testServices() {
  console.log('🚀 Testing services...\n')

  // Test Redis
  try {
    console.log('Testing Redis connection...')
    await redis.ping()
    console.log('✅ Redis connection successful\n')
  } catch (error) {
    console.error('❌ Redis connection failed:', error, '\n')
    process.exit(1)
  }

  // Test Meilisearch
  try {
    console.log('Testing Meilisearch connection...')
    const health = await client.health()
    console.log('✅ Meilisearch connection successful:', health, '\n')
  } catch (error) {
    console.error('❌ Meilisearch connection failed:', error, '\n')
    process.exit(1)
  }

  // Test Prisma/PostgreSQL
  try {
    console.log('Testing PostgreSQL connection...')
    const prisma = new PrismaClient()
    await prisma.$connect()
    const result = await prisma.$queryRaw`SELECT NOW()`
    console.log('✅ PostgreSQL connection successful:', result, '\n')
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error, '\n')
    process.exit(1)
  }

  console.log('✨ All services are running!\n')
  process.exit(0)
}

testServices() 