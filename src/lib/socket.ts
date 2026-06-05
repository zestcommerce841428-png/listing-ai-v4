/**
 * Socket.io real-time server — queue progress, scraper status, notifications
 * Mounted on /socket.io via Next.js custom server (server.ts)
 */
import { Server as SocketIOServer } from 'socket.io'
import { createServer } from 'http'
import { getQueueProgress, setQueueProgress, redis } from './redis'

let _io: SocketIOServer | null = null

export function initSocketIO(httpServer: ReturnType<typeof createServer>): SocketIOServer {
  if (_io) return _io

  _io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 10000,
  })

  _io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`)

    // Join user-specific room for private events
    socket.on('join', (userId: string) => {
      socket.join(`user:${userId}`)
      console.log(`[Socket.io] ${socket.id} joined room user:${userId}`)
    })

    // Send current queue progress on request
    socket.on('queue:status', async (userId: string) => {
      const progress = await getQueueProgress(userId)
      socket.emit('queue:progress', progress || { total: 0, done: 0, errors: 0, current: '', running: false })
    })

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`)
    })
  })

  // Subscribe to Redis pub/sub for cross-process events
  const subscriber = redis.duplicate()
  subscriber.subscribe('queue:update', 'scrape:update', 'notification')
  subscriber.on('message', (channel, message) => {
    try {
      const data = JSON.parse(message)
      if (data.userId && _io) {
        _io.to(`user:${data.userId}`).emit(channel, data)
      }
    } catch {}
  })

  return _io
}

export function getIO(): SocketIOServer | null {
  return _io
}

// ── Emit helpers (call from API routes / workers) ─────────────────────────
export async function emitQueueProgress(userId: string, progress: {
  total: number; done: number; errors: number; current: string; running: boolean
}): Promise<void> {
  await setQueueProgress(userId, progress)
  await redis.publish('queue:update', JSON.stringify({ userId, ...progress }))
}

export async function emitNotification(userId: string, notification: {
  type: 'success' | 'error' | 'info'
  title: string
  message: string
}): Promise<void> {
  await redis.publish('notification', JSON.stringify({ userId, ...notification }))
}

export async function emitScrapeResult(userId: string, result: {
  index: number
  total: number
  url: string
  status: string
  data?: Record<string, unknown>
  error?: string
}): Promise<void> {
  await redis.publish('scrape:update', JSON.stringify({ userId, ...result }))
}
