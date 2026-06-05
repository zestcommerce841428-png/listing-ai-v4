import { Redis } from 'ioredis'

// Redis is OPTIONAL — only enabled when REDIS_URL is explicitly set
const REDIS_URL = process.env.REDIS_URL

type RedisGlobal = {
  __redis?: Redis | null
  __redisOk?: boolean
}
const g = globalThis as unknown as RedisGlobal

let redis: Redis | null = null
let redisOk = false

function init() {
  if (!REDIS_URL) {
    // Redis not configured — run without caching
    g.__redis = null
    g.__redisOk = false
    return
  }

  // On hot-reload: destroy stale client so we re-attach handlers
  if (g.__redis) {
    try { g.__redis.disconnect() } catch { /* ignore */ }
    g.__redis = undefined
  }

  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 0,
    enableOfflineQueue: false,
    enableReadyCheck: false,
    lazyConnect: false, // connect immediately so error fires with our handler attached
    reconnectOnError: () => false,
    retryStrategy: () => null, // never retry
  })

  // Attach BEFORE any async tick to ensure we catch the first error
  client.on('error', () => { g.__redisOk = false })
  client.on('ready', () => { g.__redisOk = true })
  client.on('close', () => { g.__redisOk = false })
  client.on('end', () => { g.__redisOk = false })

  g.__redis = client
  g.__redisOk = false
}

// Always re-init on module load (handles hot reload)
init()

redis = g.__redis ?? null

export { redis }

// ── Helpers — silently no-op when Redis is down or not configured ─────────
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!g.__redis || !g.__redisOk) return fallback
  try {
    return await fn()
  } catch {
    g.__redisOk = false
    return fallback
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  return safe(async () => {
    const val = await g.__redis!.get(key)
    return val ? (JSON.parse(val) as T) : null
  }, null)
}

export async function setCache(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  await safe(async () => { await g.__redis!.setex(key, ttlSeconds, JSON.stringify(value)) }, undefined)
}

export async function delCache(key: string): Promise<void> {
  await safe(async () => { await g.__redis!.del(key) }, undefined)
}

export async function delCachePattern(pattern: string): Promise<void> {
  await safe(async () => {
    const keys = await g.__redis!.keys(pattern)
    if (keys.length) await g.__redis!.del(...keys)
  }, undefined)
}

export async function setQueueProgress(
  userId: string,
  progress: { total: number; done: number; errors: number; current: string; running: boolean }
): Promise<void> {
  await setCache(`queue:progress:${userId}`, progress, 3600)
}

export async function getQueueProgress(userId: string) {
  return getCache<{ total: number; done: number; errors: number; current: string; running: boolean }>(
    `queue:progress:${userId}`
  )
}

export async function checkRateLimit(key: string, limit: number, windowSecs: number): Promise<boolean> {
  return safe(async () => {
    const current = await g.__redis!.incr(key)
    if (current === 1) await g.__redis!.expire(key, windowSecs)
    return current <= limit
  }, true)
}
