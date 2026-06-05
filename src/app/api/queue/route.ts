import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { callAI, buildPrompt, extractJSON, scoreListing } from '@/lib/ai'
import { emitQueueProgress, emitNotification } from '@/lib/socket'
import { setQueueProgress, delCachePattern } from '@/lib/redis'

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { searchParams } = req.nextUrl
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '100')
  const skip = (page - 1) * limit

  const [rows, total] = await Promise.all([
    prisma.queueItem.findMany({
      where: { userId: user.id },
      include: { cat: { select: { name: true, icon: true } } },
      orderBy: { id: 'desc' },
      skip, take: limit,
    }),
    prisma.queueItem.count({ where: { userId: user.id } }),
  ])
  const statusCounts = await prisma.queueItem.groupBy({ by: ['status'], where: { userId: user.id }, _count: true })
  const statusMap: Record<string, number> = {}
  statusCounts.forEach((s: { status: string; _count: number }) => { statusMap[s.status] = s._count })
  return NextResponse.json({ rows, total, statusCounts: statusMap })
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { items } = await req.json()
  if (!items?.length) return NextResponse.json({ error: 'items required' }, { status: 400 })

  await prisma.queueItem.createMany({
    data: items.map((item: Record<string, unknown>) => ({
      userId: user.id,
      productName: String(item.product_name || item.productName || ''),
      category: String(item.category || 'general'),
      keywords: String(item.keywords || ''),
      price: item.price ? parseFloat(String(item.price)) : null,
      extraInfo: String(item.extra_info || item.extraInfo || ''),
      sourceUrl: String(item.source_url || item.sourceUrl || ''),
      platform: String(item.platform || 'shopify'),
      tone: String(item.tone || 'professional'),
      status: 'pending',
    })),
  })

  return NextResponse.json({ success: true, added: items.length }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { searchParams } = req.nextUrl
  const type = searchParams.get('type') || 'done'

  if (type === 'all') {
    await prisma.queueItem.deleteMany({ where: { userId: user.id } })
  } else {
    await prisma.queueItem.deleteMany({ where: { userId: user.id, status: { in: ['done', 'error'] } } })
  }
  return NextResponse.json({ success: true })
}

// PATCH = start processing
export async function PATCH(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { provider, apiKey, platform = 'shopify', model, tone } = await req.json()

  const pending = await prisma.queueItem.findMany({ where: { userId: user.id, status: 'pending' }, take: 500 })
  if (!pending.length) return NextResponse.json({ success: false, message: 'No pending items' })

  // Start async processing (fire and forget)
  processQueueAsync(user.id, pending, { provider, apiKey, platform, model, tone }).catch(console.error)

  return NextResponse.json({ success: true, message: `Processing ${pending.length} items`, total: pending.length })
}

async function processQueueAsync(
  userId: string,
  items: { id: number; productName: string; category: string | null; keywords: string | null; price: number | null; extraInfo: string | null; platform: string; tone: string }[],
  opts: { provider: string; apiKey: string; platform: string; model?: string; tone?: string }
) {
  let done = 0, errors = 0
  await setQueueProgress(userId, { total: items.length, done: 0, errors: 0, current: '', running: true })

  for (const item of items) {
    await emitQueueProgress(userId, { total: items.length, done, errors, current: item.productName, running: true })

    const product = { productName: item.productName, category: item.category || 'general', keywords: item.keywords || '', price: String(item.price || ''), extraInfo: item.extraInfo || '' }
    const aiOpts = { model: opts.model, tone: opts.tone || item.tone, category: item.category || 'general' }

    try {
      const raw = await callAI({ provider: opts.provider, apiKey: opts.apiKey }, buildPrompt(product, opts.platform, aiOpts), aiOpts)
      const content = extractJSON(raw) as Record<string, unknown>
      const seo = scoreListing(content, opts.platform)

      const saved = await prisma.product.create({
        data: {
          userId,
          title: content.title as string || '',
          description: content.description as string || '',
          bulletPoints: Array.isArray(content.bullet_points) ? (content.bullet_points as string[]).join('\n') : '',
          seoKeywords: content.seo_keywords as string || '',
          metaDescription: content.meta_description as string || '',
          tags: content.seo_keywords as string || '',
          aiProvider: opts.provider,
          aiModel: opts.model || '',
          aiTone: aiOpts.tone || 'professional',
          seoScore: seo.score,
          seoGrade: seo.grade,
          status: 'generated',
        },
      })

      await prisma.queueItem.update({ where: { id: item.id }, data: { status: 'done', resultId: saved.id, processedAt: new Date() } })
      done++
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      await prisma.queueItem.update({ where: { id: item.id }, data: { status: 'error', errorMsg: msg, processedAt: new Date() } })
      errors++
    }
  }

  await delCachePattern(`products:${userId}:*`)
  await setQueueProgress(userId, { total: items.length, done, errors, current: '', running: false })
  await emitQueueProgress(userId, { total: items.length, done, errors, current: '', running: false })
  await emitNotification(userId, {
    type: errors === 0 ? 'success' : 'info',
    title: 'Queue Complete',
    message: `${done}/${items.length} products generated successfully.`,
  })
}
