import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCache, setCache } from '@/lib/redis'

// GET /api/blog/posts — public list with pagination, search, filter
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50)
  const q = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const featured = searchParams.get('featured') === 'true'
  const skip = (page - 1) * limit

  const cacheKey = `blog:posts:${page}:${limit}:${q}:${category}:${featured}`
  const cached = await getCache(cacheKey)
  if (cached) return NextResponse.json(cached)

  const where = {
    status: 'published',
    ...(q && { OR: [{ title: { contains: q } }, { excerpt: { contains: q } }, { tags: { contains: q } }] }),
    ...(category && { category: { slug: category } }),
    ...(featured && { featured: true }),
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: { category: { select: { name: true, slug: true, icon: true, color: true } } },
      orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
      skip, take: limit,
      select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, category: true, tags: true, authorName: true, publishedAt: true, readTime: true, views: true, featured: true },
    }),
    prisma.blogPost.count({ where }),
  ])

  const result = { posts, total, page, pages: Math.ceil(total / limit), limit }
  await setCache(cacheKey, result, 120)
  return NextResponse.json(result)
}

// POST /api/blog/posts — create (admin only, no auth check here — handled by admin routes)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, slug, excerpt, content, coverImage, categoryId, tags, authorName, status, featured, readTime, seoTitle, seoDescription } = body
  if (!title || !slug || !content) return NextResponse.json({ error: 'title, slug, content required' }, { status: 400 })

  const post = await prisma.blogPost.create({
    data: {
      title, slug, excerpt: excerpt || title, content, coverImage, categoryId: categoryId || null,
      tags, authorName: authorName || 'ListingAI Team', status: status || 'published',
      featured: !!featured, readTime: readTime || Math.ceil(content.split(' ').length / 200),
      seoTitle, seoDescription, publishedAt: status !== 'draft' ? new Date() : null,
    },
  })

  // Update category post count
  if (categoryId) {
    await prisma.blogCategory.update({ where: { id: categoryId }, data: { postCount: { increment: 1 } } })
  }

  return NextResponse.json({ success: true, post }, { status: 201 })
}
