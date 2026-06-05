import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const REQUIRED: Record<string, string[]> = {
  shopify: ['title', 'price'],
  amazon:  ['title', 'sku', 'price', 'vendor'],
  woocommerce: ['title', 'price'],
}
const RECOMMENDED: Record<string, string[]> = {
  shopify: ['description', 'imageUrl', 'tags', 'metaDescription', 'vendor', 'type'],
  amazon:  ['bulletPoints', 'imageUrl', 'tags', 'quantity', 'type'],
  woocommerce: ['description', 'imageUrl', 'tags', 'type'],
}

// POST /api/tools/validate — validate listings against platform requirements
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { listings, platform = 'shopify' } = await req.json()
  if (!listings?.length) return NextResponse.json({ error: 'listings array required' }, { status: 400 })

  const required = REQUIRED[platform] || REQUIRED.shopify
  const recommended = RECOMMENDED[platform] || RECOMMENDED.shopify

  const results = listings.map((l: Record<string, unknown>, idx: number) => {
    const missingRequired = required.filter(f => {
      const val = l[f]
      return !val || String(val).trim() === ''
    })
    const missingRecommended = recommended.filter(f => {
      if (f === 'bulletPoints') {
        const bp = l.bulletPoints
        return !bp || (typeof bp === 'string' && bp.trim() === '') || (Array.isArray(bp) && bp.length === 0)
      }
      const val = l[f]
      return !val || String(val).trim() === ''
    })

    const completeness = Math.round(
      ((required.length - missingRequired.length) / required.length) * 60 +
      ((recommended.length - missingRecommended.length) / recommended.length) * 40
    )

    // SEO checks
    const seoIssues: string[] = []
    const title = String(l.title || '')
    const desc = String(l.description || '')
    const meta = String(l.metaDescription || '')
    if (platform === 'shopify' && title.length > 70) seoIssues.push('Title too long for Shopify SEO (>70 chars)')
    if (platform === 'amazon' && title.length > 200) seoIssues.push('Title too long for Amazon (>200 chars)')
    if (title.length < 20) seoIssues.push('Title too short (<20 chars)')
    if (desc.replace(/<[^>]+>/g, '').length < 100) seoIssues.push('Description too short (<100 chars)')
    if (meta.length > 160) seoIssues.push('Meta description too long (>160 chars)')
    if (meta.length > 0 && meta.length < 50) seoIssues.push('Meta description too short (<50 chars)')

    return {
      index: idx,
      title: title || `Row ${idx + 1}`,
      sku: String(l.sku || ''),
      completeness,
      grade: completeness >= 90 ? 'A' : completeness >= 70 ? 'B' : completeness >= 50 ? 'C' : 'D',
      missingRequired,
      missingRecommended,
      seoIssues,
      ready: missingRequired.length === 0,
    }
  })

  const readyCount = results.filter((r: { ready: boolean }) => r.ready).length
  const avgCompleteness = Math.round(results.reduce((s: number, r: { completeness: number }) => s + r.completeness, 0) / results.length)

  return NextResponse.json({
    results,
    readyCount,
    total: listings.length,
    platform,
    avgCompleteness,
    requiredFields: required,
    recommendedFields: recommended,
  })
}
