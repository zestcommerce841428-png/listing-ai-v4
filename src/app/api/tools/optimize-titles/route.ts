import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// POST /api/tools/optimize-titles — clean and optimize product titles
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { titles, platform = 'shopify' } = await req.json()
  if (!titles?.length) return NextResponse.json({ error: 'titles array required' }, { status: 400 })

  const maxLen = platform === 'amazon' ? 200 : platform === 'shopify' ? 70 : 200

  const optimized = titles.map((title: string) => {
    if (!title) return { original: title, optimized: title, changes: [], length: 0, lengthOk: true }
    const changes: string[] = []
    let t = title

    // Strip HTML tags
    if (/<[^>]+>/.test(t)) { t = t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); changes.push('Removed HTML tags') }
    // Fix HTML entities
    t = t.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    // Trim whitespace
    if (t !== t.trim()) { t = t.trim(); changes.push('Trimmed whitespace') }
    // Remove double spaces
    if (/  +/.test(t)) { t = t.replace(/  +/g, ' '); changes.push('Fixed double spaces') }
    // Title case for short titles
    if (t.length < 60 && t === t.toLowerCase()) {
      t = t.replace(/\b\w/g, c => c.toUpperCase())
      changes.push('Applied title case')
    }
    // Remove trailing punctuation
    t = t.replace(/[,;:!?]+$/, '').trim()
    // Trim to max length at word boundary
    if (t.length > maxLen) {
      t = t.slice(0, maxLen).replace(/\s+\S*$/, '').trim()
      changes.push(`Trimmed to ${maxLen} chars`)
    }
    return { original: title, optimized: t, changes, length: t.length, lengthOk: t.length <= maxLen }
  })

  return NextResponse.json({ optimized, platform, maxLen })
}
