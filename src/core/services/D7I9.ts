import { PrismaClient } from "@prisma/client"
import { Redis } from "ioredis"
import { MeiliSearch } from "meilisearch"

const prisma = new PrismaClient()
const redis = new Redis(process.env.REDIS_URL)
const meilisearch = new MeiliSearch({
  host: process.env.MEILI_HOST || "http://localhost:7700",
  apiKey: process.env.MEILI_MASTER_KEY,
})

async function main() {
  console.log("🚀 Starting services setup...")

  try {
    // Test Redis connection
    await redis.ping()
    console.log("✅ Redis connection successful")

    // Setup Meilisearch indices
    await meilisearch.createIndex("courses", { primaryKey: "id" })
    await meilisearch.createIndex("lessons", { primaryKey: "id" })
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
    await redis.quit()
  }
}

main() 