import { PrismaClient } from "@prisma/client"
import { redis } from "../../lib/redis"
import client from "../../lib/meilisearch"
import { setupMeilisearchIndices } from "../../lib/meilisearch"

const prisma = new PrismaClient()

async function main() {
  console.log("🚀 Starting services setup...")

  try {
    // Test Redis connection
    const testKey = 'test-connection'
    await redis.set(testKey, 'success')
    const result = await redis.get(testKey)
    await redis.del(testKey)
    
    if (result === 'success') {
      console.log("✅ Redis connection successful")
    } else {
      throw new Error('Redis test failed')
    }

    // Setup Meilisearch indices
    await setupMeilisearchIndices()
    console.log("✅ Meilisearch indices created")

    // Test Prisma connection
    await prisma.$connect()
    console.log("✅ Database connection successful")

    console.log("✨ All services initialized successfully!")
  } catch (error) {
    console.error("❌ Error during services setup:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 