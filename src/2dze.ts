import { Redis } from '@upstash/redis'

if (!process.env.UPSTASH_REDIS_REST_URL) {
  throw new Error('UPSTASH_REDIS_REST_URL is not defined')
}

if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('UPSTASH_REDIS_REST_TOKEN is not defined')
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
}) as Redis

// Cache helpers
export const CACHE_TIMES = {
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  FIFTEEN_MINUTES: 900,
  ONE_HOUR: 3600,
  ONE_DAY: 86400,
  ONE_WEEK: 604800,
} as const

export async function getCachedData<T>(key: string): Promise<T | null> {
  const data = await redis.get(key)
  return data ? JSON.parse(data) : null
}

export async function setCachedData<T>(
  key: string,
  data: T,
  expiresIn = CACHE_TIMES.FIFTEEN_MINUTES
): Promise<void> {
  await redis.setex(key, expiresIn, JSON.stringify(data))
}

export async function invalidateCache(key: string): Promise<void> {
  await redis.del(key)
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern)
  if (keys.length) {
    await redis.del(...keys)
  }
} 