import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { callAI, buildPrompt, extractJSON, scoreListing, AICredentials, AIOptions } from '@/lib/ai'
import { emitQueueProgress } from '@/lib/socket'
import { delCachePattern } from '@/lib/redis'

// POST /api/ai/generate — bulk content generation with SSE streaming
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { provider, apiKey, products, platform, saveToDb, ...opts } = await req.json()
  if (!products?.length) return NextResponse.json({ error: 'No products provided' }, { status: 400 })

  const credentials: AICredentials = { provider, apiKey }
  const aiOpts: AIOptions = {
    model: opts.model,
    temperature: opts.temperature,
    maxTokens: opts.maxTokens,
    systemPrompt: opts.systemPrompt,
    tone: opts.tone,
    category: opts.category,
  }

  // Return SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const send = (data: unknown) => controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`))

      send({ type: 'start', total: products.length })
      await emitQueueProgress(user.id, { total: products.length, done: 0, errors: 0, current: '', running: true })

      let done = 0, errors = 0

      for (let i = 0; i < products.length; i++) {
        const p = products[i]
        send({ type: 'progress', index: i, total: products.length, productName: p.productName })
        await emitQueueProgress(user.id, { total: products.length, done: i, errors, current: p.productName, running: true })

        try {
          const pOpts = { ...aiOpts, category: aiOpts.category || p.category }
          const raw = await callAI(credentials, buildPrompt(p, platform || 'shopify', pOpts), pOpts)
          const content = extractJSON(raw) as Record<string, unknown>
          const seo = scoreListing(content, platform || 'shopify')

          let savedId: number | null = null
          if (saveToDb) {
            const row = await prisma.product.create({
              data: {
                userId: user.id,
                title: content.title as string || '',
                description: content.description as string || '',
                bulletPoints: Array.isArray(content.bullet_points) ? (content.bullet_points as string[]).join('\n') : '',
                seoKeywords: content.seo_keywords as string || '',
                metaDescription: content.meta_description as string || '',
                tags: content.seo_keywords as string || '',
                aiProvider: provider,
                aiModel: aiOpts.model || '',
                aiTone: aiOpts.tone || 'professional',
                seoScore: seo.score,
                seoGrade: seo.grade,
                status: 'generated',
              },
            })
            savedId = row.id
            await delCachePattern(`products:${user.id}:*`)
          }

          send({ type: 'result', index: i, productName: p.productName, status: 'success', content, seo, savedId })
          done++
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e)
          send({ type: 'result', index: i, productName: p.productName, status: 'error', reason: msg })
          errors++
        }
      }

      await emitQueueProgress(user.id, { total: products.length, done, errors, current: '', running: false })
      send({ type: 'done', total: products.length, done, errors })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
