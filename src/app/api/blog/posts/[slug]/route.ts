import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCache, setCache, delCachePattern } from '@/lib/redis'

// GET /api/blog/posts/[slug]
export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const cacheKey = `blog:post:${params.slug}`
  const cached = await getCache(cacheKey)
  if (cached) return NextResponse.json(cached)

  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug },
    include: { category: true },
  })
  if (!post || post.status !== 'published') return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Increment views async
  prisma.blogPost.update({ where: { id: post.id }, data: { views: { increment: 1 } } }).catch(() => {})

  await setCache(cacheKey, post, 300)
  return NextResponse.json(post)
}

// PUT /api/blog/posts/[slug] — admin update
export async function PUT(req: NextRequest, { params }: { params: { slug: string } }) {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  const updated = await prisma.blogPost.update({ where: { id: post.id }, data: { ...body, updatedAt: new Date() } })
  await delCachePattern('blog:*')
  return NextResponse.json({ success: true, post: updated })
}

// DELETE /api/blog/posts/[slug]
export async function DELETE(_req: NextRequest, { params }: { params: { slug: string } }) {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.blogPost.delete({ where: { id: post.id } })
  await delCachePattern('blog:*')
  return NextResponse.json({ success: true })
}
