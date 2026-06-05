import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { scrapeProduct } from '@/lib/scraper'
import { emitScrapeResult } from '@/lib/socket'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { urls, proxy, delay = 1200 } = await req.json()
  if (!urls?.length) return NextResponse.json({ error: 'URLs required' }, { status: 400 })

  // SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const send = (data: unknown) => controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`))
      send({ type: 'start', total: urls.length })

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i].trim()
        if (!url) continue
        try {
          const delayMs = i === 0 ? 0 : delay + Math.random() * 400
          await new Promise(r => setTimeout(r, delayMs))
          const data = await scrapeProduct(url, proxy)
          send({ type: 'result', index: i + 1, total: urls.length, url, status: 'success', data })
          await emitScrapeResult(user.id, { index: i + 1, total: urls.length, url, status: 'success', data: data as unknown as Record<string, unknown> })
        } catch (e: unknown) {
          const error = e instanceof Error ? e.message : String(e)
          send({ type: 'result', index: i + 1, total: urls.length, url, status: 'error', error })
          await emitScrapeResult(user.id, { index: i + 1, total: urls.length, url, status: 'error', error })
        }
      }

      send({ type: 'done' })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' },
  })
}
