import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/redis'
import { delCachePattern } from '@/lib/redis'

// POST /api/products/bulk — bulk import products from JSON
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Rate limit: 10 bulk imports per 10 minutes
  const allowed = await checkRateLimit(`bulk:${user.id}`, 10, 600)
  if (!allowed) return NextResponse.json({ error: 'Rate limit: 10 bulk imports per 10 minutes' }, { status: 429 })

  const { listings, status = 'draft' } = await req.json()
  if (!listings?.length) return NextResponse.json({ error: 'listings array required' }, { status: 400 })
  if (listings.length > 5000) return NextResponse.json({ error: 'Max 5000 listings per import' }, { status: 400 })

  let saved = 0
  const errors: string[] = []

  // Batch insert in chunks of 100
  const chunkSize = 100
  for (let i = 0; i < listings.length; i += chunkSize) {
    const chunk = listings.slice(i, i + chunkSize)
    try {
      const data = chunk
        .filter((l: Record<string, unknown>) => l.title)
        .map((l: Record<string, unknown>) => ({
          userId: user.id,
          title: String(l.title || '').slice(0, 500),
          sku: String(l.sku || '').slice(0, 100),
          price: l.price != null ? parseFloat(String(l.price)) : null,
          comparePrice: l.comparePrice != null ? parseFloat(String(l.comparePrice)) : null,
          costPrice: l.costPrice != null ? parseFloat(String(l.costPrice)) : null,
          vendor: String(l.vendor || '').slice(0, 255),
          categoryName: String(l.category || l.categoryName || '').slice(0, 100),
          type: String(l.type || '').slice(0, 100),
          tags: String(l.tags || l.seoKeywords || '').slice(0, 1000),
          description: String(l.description || '').slice(0, 65000),
          bulletPoints: Array.isArray(l.bulletPoints) ? l.bulletPoints.join('\n') : String(l.bulletPoints || '').slice(0, 2000),
          seoKeywords: String(l.seoKeywords || l.tags || '').slice(0, 1000),
          metaDescription: String(l.metaDescription || '').slice(0, 200),
          imageUrl: String(l.imageUrl || l.image_url || '').slice(0, 2000),
          altText: String(l.altText || '').slice(0, 200),
          quantity: parseInt(String(l.quantity || '100')) || 100,
          sourceUrl: String(l.sourceUrl || '').slice(0, 2000),
          sourceMarketplace: String(l.sourceMarketplace || '').slice(0, 50),
          status,
          notes: String(l.notes || '').slice(0, 2000),
        }))

      if (data.length) {
        await prisma.product.createMany({ data, skipDuplicates: false })
        saved += data.length
      }
    } catch (e: unknown) {
      errors.push(`Chunk ${i}-${i + chunkSize}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  await delCachePattern(`products:${user.id}:*`)

  return NextResponse.json({
    success: true,
    saved,
    errors: errors.slice(0, 10),
    total: listings.length,
  }, { status: 201 })
}
