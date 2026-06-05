import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { delCachePattern, getCache, setCache } from '@/lib/redis'

// GET /api/products — list with search, filter, pagination
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { searchParams } = req.nextUrl
    const q = searchParams.get('q') || ''
    const status = searchParams.get('status') || undefined
    const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit

    const cacheKey = `products:${user.id}:${q}:${status}:${categoryId}:${page}:${limit}`
    const cached = await getCache(cacheKey)
    if (cached) return NextResponse.json(cached)

    const where = {
      userId: user.id,
      ...(status && { status }),
      ...(categoryId && { categoryId }),
      ...(q && {
        OR: [
          { title: { contains: q } },
          { sku: { contains: q } },
          { vendor: { contains: q } },
          { tags: { contains: q } },
        ],
      }),
    }

    const [rows, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true, icon: true, color: true } } },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    const result = { rows, total, page, pages: Math.ceil(total / limit) }
    await setCache(cacheKey, result, 60)
    return NextResponse.json(result)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/products — create product
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json()
    const product = await prisma.product.create({
      data: { userId: user.id, ...body, price: body.price ? parseFloat(body.price) : null, comparePrice: body.comparePrice ? parseFloat(body.comparePrice) : null, costPrice: body.costPrice ? parseFloat(body.costPrice) : null },
    })
    await delCachePattern(`products:${user.id}:*`)
    return NextResponse.json({ success: true, product }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
