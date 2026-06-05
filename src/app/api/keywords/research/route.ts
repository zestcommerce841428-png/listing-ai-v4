import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/redis'
import * as cheerio from 'cheerio'

// POST /api/keywords/research — scrape competitor URLs for keyword extraction
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const allowed = await checkRateLimit(`kwresearch:${user.id}`, 20, 60)
  if (!allowed) return NextResponse.json({ error: 'Rate limit: 20 requests/min' }, { status: 429 })

  const { urls = [], productName = '' } = await req.json()
  if (!urls.length && !productName) return NextResponse.json({ error: 'Provide urls or productName' }, { status: 400 })

  const allWords: Record<string, number> = {}

  const addWord = (w: string, weight = 1) => {
    w = w.toLowerCase().replace(/[^a-z0-9\s\-]/g, '').trim()
    if (w.length < 3) return
    if (/^(the|and|for|with|this|that|from|your|our|are|has|have|not|but|can|will|was|its|this|they|been|more|have|also|which|when|than|then|them|some|into|just|well|very|what|were|here)$/.test(w)) return
    allWords[w] = (allWords[w] || 0) + weight
  }

  for (const url of urls.slice(0, 5)) {
    try {
      const res = await fetch(url.trim(), {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0' },
        signal: AbortSignal.timeout(12000),
      })
      const html = await res.text()
      const $ = cheerio.load(html)
      $('h1,h2').each((_, el) => $(el).text().split(/\s+/).forEach(w => addWord(w, 3)))
      const metaKw = $('meta[name="keywords"]').attr('content') || ''
      metaKw.split(',').forEach(w => addWord(w.trim(), 4))
      $('[class*="feature"],[class*="bullet"],[class*="description"],[class*="highlight"]').each((_, el) =>
        $(el).text().split(/\s+/).forEach(w => addWord(w, 2))
      )
      $('body').text().split(/\s+/).slice(0, 500).forEach(w => addWord(w, 1))
    } catch { /* skip failed URLs */ }
  }

  if (productName) productName.split(/\s+/).forEach((w: string) => addWord(w, 5))

  const keywords = Object.entries(allWords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 80)
    .map(([word, count]) => ({ word, count }))

  return NextResponse.json({
    keywords,
    primary: keywords.slice(0, 8).map(k => k.word),
    secondary: keywords.slice(8, 25).map(k => k.word),
    longtail: keywords.slice(25, 60).map(k => k.word),
    total: keywords.length,
  })
}
