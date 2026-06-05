import { Redis } from 'ioredis'

const globalForRedis = globalThis as unknown as { redis: Redis | undefined }

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy: (times) => Math.min(times * 100, 3000),
  })

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

// ── Cache helpers ─────────────────────────────────────────────────────────
export async function getCache<T>(key: string): Promise<T | null> {
  const val = await redis.get(key)
  return val ? JSON.parse(val) : null
}

export async function setCache(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  await redis.setex(key, ttlSeconds, JSON.stringify(value))
}

export async function delCache(key: string): Promise<void> {
  await redis.del(key)
}

export async function delCachePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern)
  if (keys.length) await redis.del(...keys)
}

// ── Queue state stored in Redis ───────────────────────────────────────────
export async function setQueueProgress(
  userId: string,
  progress: { total: number; done: number; errors: number; current: string; running: boolean }
): Promise<void> {
  await redis.setex(`queue:progress:${userId}`, 3600, JSON.stringify(progress))
}

export async function getQueueProgress(userId: string) {
  return getCache<{ total: number; done: number; errors: number; current: string; running: boolean }>(
    `queue:progress:${userId}`
  )
}

// ── Rate limiting ─────────────────────────────────────────────────────────
export async function checkRateLimit(key: string, limit: number, windowSecs: number): Promise<boolean> {
  const current = await redis.incr(key)
  if (current === 1) await redis.expire(key, windowSecs)
  return current <= limit
}
