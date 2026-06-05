import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { delCachePattern, getCache, setCache } from '@/lib/redis'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const cacheKey = `categories:${user.id}`
    const cached = await getCache(cacheKey)
    if (cached) return NextResponse.json({ categories: cached })

    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    await setCache(cacheKey, categories, 300)
    return NextResponse.json({ categories })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const { name, icon = '📦', color = '#6366f1', tone = 'professional', promptHint, description, sortOrder = 99 } = body
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

    let slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 60)
    const existing = await prisma.category.findFirst({ where: { userId: user.id, slug } })
    if (existing) slug = slug + '-' + Date.now().toString().slice(-4)

    const category = await prisma.category.create({
      data: { userId: user.id, name, slug, icon, color, tone, promptHint, description, sortOrder },
    })
    await delCachePattern(`categories:${user.id}`)
    return NextResponse.json({ success: true, category }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
