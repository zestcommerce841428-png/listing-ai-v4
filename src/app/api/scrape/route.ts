import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { scrapeProduct, detectMarketplace } from '@/lib/scraper'
import { checkRateLimit } from '@/lib/redis'

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit: 30 scrapes/minute per user
  const allowed = await checkRateLimit(`scrape:${clerkId}`, 30, 60)
  if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded. Wait 1 minute.' }, { status: 429 })

  const { url, proxy, delay } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  try {
    const data = await scrapeProduct(url, proxy, delay || 800)
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Scrape failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const url = searchParams.get('url') || ''
  return NextResponse.json({ marketplace: detectMarketplace(url) })
}
