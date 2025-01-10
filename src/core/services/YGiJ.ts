import { setupMeilisearchIndices } from '../lib/meilisearch'
import { redis } from '../lib/redis'
import { PrismaClient } from '@prisma/client'

async function setup() {
  console.log('🚀 Starting services setup...')

  try {
    // Test Redis connection
    console.log('Testing Redis connection...')
    await redis.ping()
    console.log('✅ Redis connection successful')

    // Setup Meilisearch indices
    console.log('Setting up Meilisearch indices...')
    await setupMeilisearchIndices()
    console.log('✅ Meilisearch indices created')

    // Test Prisma connection
    console.log('Testing Prisma connection...')
    const prisma = new PrismaClient()
    await prisma.$connect()
    console.log('✅ Prisma connection successful')
    await prisma.$disconnect()

    console.log('✨ All services initialized successfully!')
  } catch (error) {
    console.error('❌ Error during setup:', error)
    process.exit(1)
  }
}

setup() 