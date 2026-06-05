/**
 * ListingAI — Master Tools API
 * 27+ real, production-grade listing management tools
 * POST /api/tools — pass { tool, ...params }
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { callAI } from '@/lib/ai'
import { checkRateLimit, getCache, setCache } from '@/lib/redis'
import * as cheerio from 'cheerio'

// ── Helper ─────────────────────────────────────────────────────────────────────
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// ── TOOL HANDLERS ──────────────────────────────────────────────────────────────

// 1. Bulk AI Rewrite — AI rewrites titles/descriptions for multiple products
async function bulkRewrite(body: Record<string, unknown>, userId: string, clerkId: string) {
  const { productIds, field = 'title', platform = 'shopify', provider, apiKey, tone = 'professional' } = body
  if (!Array.isArray(productIds) || !productIds.length) return { error: 'productIds required' }
  const allowed = await checkRateLimit(`bulk-rewrite:${userId}`, 10, 3600)
  if (!allowed) return { error: 'Rate limit: 10 bulk rewrites per hour' }

  const products = await prisma.product.findMany({ where: { id: { in: productIds.map(Number) }, userId } })
  const results: Array<{id: number; original: string; rewritten: string}> = []

  for (const p of products) {
    const original = field === 'title' ? p.title : field === 'description' ? (p.description || '') : (p.seoKeywords || '')
    if (!original) continue
    const prompt = `Rewrite this product ${field} to be more SEO-optimised and compelling for ${platform}. Return ONLY the rewritten text, no quotes or explanation.\n\nOriginal: ${original}`
    try {
      const rewritten = await callAI({ provider: String(provider), apiKey: String(apiKey) }, prompt, { tone: String(tone), maxTokens: 200, temperature: 0.7 })
      results.push({ id: p.id, original, rewritten: rewritten.trim() })
    } catch { results.push({ id: p.id, original, rewritten: original }) }
  }
  return { results, total: results.length }
}

// 2. SEO Analyzer — detailed per-product SEO analysis
async function seoAnalyze(body: Record<string, unknown>, userId: string) {
  const { productIds } = body
  if (!Array.isArray(productIds)) return { error: 'productIds required' }
  const products = await prisma.product.findMany({ where: { id: { in: productIds.map(Number) }, userId } })
  
  const results = products.map(p => {
    const title = p.title || ''
    const desc = stripHtml(p.description || '')
    const kw = p.seoKeywords || ''
    const meta = p.metaDescription || ''
    const bp = p.bulletPoints?.split('\n').filter(Boolean) || []
    const issues: string[] = []
    const tips: string[] = []
    let score = 0

    if (title.length >= 30) score += 15; else issues.push('Title too short')
    if (title.length <= 70) score += 5; else issues.push('Title too long for Shopify (>70 chars)')
    if (desc.length >= 200) score += 20; else { issues.push('Description < 200 chars'); tips.push('Write at least 200 chars for SEO') }
    if (desc.length >= 500) score += 5
    if (bp.length >= 5) score += 15; else issues.push(`Only ${bp.length}/5 bullet points`)
    if (bp.every(b => b.length > 20)) score += 5
    const kwArr = kw.split(',').filter(k => k.trim())
    if (kwArr.length >= 8) score += 15; else issues.push(`Only ${kwArr.length} keywords (need 8+)`)
    if (meta.length >= 50 && meta.length <= 160) score += 10; else issues.push('Meta description wrong length')
    if (p.imageUrl) score += 5; else { issues.push('No image URL'); tips.push('Add a product image for higher CTR') }
    if (p.sku) score += 3
    if (p.vendor) score += 2
    // Keyword presence in title
    const kwInTitle = kwArr.filter(k => title.toLowerCase().includes(k.trim().toLowerCase()))
    if (kwInTitle.length > 0) score += 5; else tips.push('Include primary keyword in title')

    score = Math.min(100, score)
    return { id: p.id, title: p.title, score, grade: score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'D', issues, tips }
  })

  const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0
  return { results, avgScore, total: results.length }
}

// 3. Auto-Classify — AI assigns categories to products
async function autoClassify(body: Record<string, unknown>, userId: string) {
  const { productIds, provider, apiKey } = body
  if (!Array.isArray(productIds)) return { error: 'productIds required' }
  const categories = await prisma.category.findMany({ where: { userId }, select: { id: true, name: true, slug: true } })
  const catList = categories.map(c => c.name).join(', ')
  const products = await prisma.product.findMany({ where: { id: { in: productIds.map(Number) }, userId } })
  const results: Array<{id: number; title: string; category: string; categoryId: number | null}> = []

  for (const p of products) {
    const prompt = `Classify this product into ONE of these categories: ${catList}\nProduct: "${p.title}"\nReturn ONLY the category name, nothing else.`
    try {
      const raw = await callAI({ provider: String(provider), apiKey: String(apiKey) }, prompt, { temperature: 0.2, maxTokens: 30 })
      const catName = raw.trim()
      const match = categories.find(c => c.name.toLowerCase() === catName.toLowerCase() || catName.toLowerCase().includes(c.name.toLowerCase()))
      if (match) {
        await prisma.product.update({ where: { id: p.id }, data: { categoryId: match.id, categoryName: match.name } })
        results.push({ id: p.id, title: p.title, category: match.name, categoryId: match.id })
      } else {
        results.push({ id: p.id, title: p.title, category: catName, categoryId: null })
      }
    } catch { results.push({ id: p.id, title: p.title, category: 'Unknown', categoryId: null }) }
  }
  return { results, classified: results.filter(r => r.categoryId).length }
}

// 4. Tag Extractor — extract relevant tags from product descriptions
function tagExtractor(body: Record<string, unknown>) {
  const { texts, maxTags = 10 } = body
  if (!Array.isArray(texts)) return { error: 'texts array required' }
  const stopWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','are','was','were','be','been','have','has','this','that','it','its','as','not','we','you','they'])

  return texts.map((text: string) => {
    const words: Record<string, number> = {}
    text.toLowerCase().replace(/[^a-z0-9\s\-]/g, '').split(/\s+/).forEach(w => {
      if (w.length > 2 && !stopWords.has(w)) words[w] = (words[w] || 0) + 1
    })
    const tags = Object.entries(words).sort((a, b) => b[1] - a[1]).slice(0, Number(maxTags)).map(([word]) => word)
    return { text: text.slice(0, 50), tags }
  })
}

// 5. Keyword Density Analyzer
function keywordDensity(body: Record<string, unknown>) {
  const { text, keywords } = body
  if (!text || !Array.isArray(keywords)) return { error: 'text and keywords required' }
  const lowerText = String(text).toLowerCase()
  const wordCount = lowerText.split(/\s+/).length
  const analysis = (keywords as string[]).map(kw => {
    const regex = new RegExp(kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    const matches = (lowerText.match(regex) || []).length
    const density = wordCount > 0 ? parseFloat(((matches / wordCount) * 100).toFixed(2)) : 0
    return { keyword: kw, occurrences: matches, density, status: density < 0.5 ? 'under' : density > 3 ? 'over' : 'optimal' }
  })
  return { analysis, wordCount, totalKeywords: keywords.length }
}

// 6. Listing Preview — HTML preview of listing on Shopify or Amazon
function listingPreview(body: Record<string, unknown>) {
  const { product, platform = 'shopify' } = body as { product: Record<string, string>; platform: string }
  const bp = (product.bulletPoints || '').split('\n').filter(Boolean)
  if (platform === 'shopify') {
    return {
      html: `<div style="font-family:sans-serif;max-width:700px;padding:20px">
<h1 style="font-size:24px;color:#1f2937">${product.title || 'Product Title'}</h1>
<div style="font-size:20px;color:#e53e3e;font-weight:700;margin:12px 0">$${product.price || '0.00'}</div>
<div style="color:#374151;line-height:1.7;margin:16px 0">${product.description || ''}</div>
${bp.length ? `<ul style="margin:16px 0;padding-left:20px">${bp.map(b => `<li style="margin-bottom:6px;color:#374151">${b}</li>`).join('')}</ul>` : ''}
<div style="font-size:12px;color:#6b7280;margin-top:16px">Tags: ${product.tags || ''}</div>
<div style="font-size:11px;color:#9ca3af;margin-top:8px">SEO: ${product.metaDescription || ''}</div>
</div>`,
      platform: 'shopify'
    }
  }
  return {
    html: `<div style="font-family:Arial,sans-serif;max-width:800px;padding:20px;background:#f3f4f6">
<h1 style="font-size:18px;color:#0f1111">${product.title || 'Product Title'}</h1>
<div style="font-size:22px;color:#B12704;font-weight:700">$${product.price || '0.00'}</div>
<div style="margin:16px 0"><strong>About this item</strong><ul style="padding-left:20px;margin-top:8px">${bp.map(b => `<li style="margin-bottom:6px">${b}</li>`).join('')}</ul></div>
<div style="color:#565959;font-size:14px">${stripHtml(product.description || '')}</div>
<div style="font-size:11px;color:#999;margin-top:12px">Search terms: ${product.seoKeywords || ''}</div>
</div>`,
    platform: 'amazon'
  }
}

// 7. Bundle Suggester — AI suggests product bundle combinations
async function bundleSuggest(body: Record<string, unknown>, userId: string) {
  const { productIds, provider, apiKey } = body
  if (!Array.isArray(productIds)) return { error: 'productIds required' }
  const products = await prisma.product.findMany({ where: { id: { in: productIds.map(Number) }, userId } })
  const titles = products.map(p => p.title).join(', ')
  const prompt = `You are an ecommerce expert. Suggest 5 product bundle ideas using some or all of these products: ${titles}
For each bundle, suggest: bundle name, which products to include, selling price, and marketing hook.
Return as JSON array: [{"name":"...","products":["..."],"price":"...","hook":"..."}]`
  try {
    const raw = await callAI({ provider: String(provider), apiKey: String(apiKey) }, prompt, { temperature: 0.8, maxTokens: 600 })
    const m = raw.match(/\[[\s\S]*\]/)
    return { bundles: m ? JSON.parse(m[0]) : [], products: titles }
  } catch (e: unknown) { return { error: e instanceof Error ? e.message : String(e) } }
}

// 8. Margin Calculator
function marginCalc(body: Record<string, unknown>) {
  const { products } = body
  if (!Array.isArray(products)) return { error: 'products array required' }
  const results = products.map((p: Record<string, number>) => {
    const price = parseFloat(String(p.price || 0))
    const cost = parseFloat(String(p.cost || 0))
    const fees = parseFloat(String(p.fees || 0))
    const shipping = parseFloat(String(p.shipping || 0))
    const totalCost = cost + fees + shipping
    const profit = price - totalCost
    const margin = price > 0 ? parseFloat(((profit / price) * 100).toFixed(2)) : 0
    const roi = totalCost > 0 ? parseFloat(((profit / totalCost) * 100).toFixed(2)) : 0
    return {
      ...p,
      totalCost: parseFloat(totalCost.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      margin,
      roi,
      status: margin >= 40 ? 'excellent' : margin >= 25 ? 'good' : margin >= 10 ? 'ok' : 'poor'
    }
  })
  const avgMargin = results.reduce((s: number, r: { margin: number; [k: string]: unknown }) => s + (r.margin || 0), 0) / results.length
  return { results, avgMargin: parseFloat(avgMargin.toFixed(2)) }
}

// 9. Inventory Alerts — flag low/zero quantity products
async function inventoryAlerts(body: Record<string, unknown>, userId: string) {
  const { threshold = 10 } = body
  const products = await prisma.product.findMany({
    where: { userId, quantity: { lte: Number(threshold) } },
    orderBy: { quantity: 'asc' },
    take: 100,
  })
  return {
    alerts: products.map(p => ({
      id: p.id, title: p.title, sku: p.sku, quantity: p.quantity,
      status: p.quantity === 0 ? 'out_of_stock' : p.quantity <= 5 ? 'critical' : 'low',
    })),
    total: products.length,
    outOfStock: products.filter(p => p.quantity === 0).length,
  }
}

// 10. Bullet Optimizer — AI reorders and improves bullet points
async function bulletOptimizer(body: Record<string, unknown>) {
  const { bullets, productName, platform = 'amazon', provider, apiKey } = body
  if (!Array.isArray(bullets) || !bullets.length) return { error: 'bullets array required' }
  const prompt = `Optimize these bullet points for a ${platform} product listing of "${productName}".
Rules: Start each with an ALL-CAPS benefit word, make them 40-120 chars, put most important first, be specific.
Current bullets: ${(bullets as string[]).join('\n')}
Return ONLY the improved bullets as a JSON array of 5 strings: ["...","...","...","...","..."]`
  try {
    const raw = await callAI({ provider: String(provider), apiKey: String(apiKey) }, prompt, { temperature: 0.6, maxTokens: 400 })
    const m = raw.match(/\[[\s\S]*\]/)
    return { optimized: m ? JSON.parse(m[0]) : bullets, original: bullets }
  } catch (e: unknown) { return { error: e instanceof Error ? e.message : String(e) } }
}

// 11. Description Builder — structured HTML description from features
function descriptionBuilder(body: Record<string, unknown>) {
  const { productName, features, benefits, specs, audience } = body as Record<string, string | string[]>
  const featureList = Array.isArray(features) ? features : String(features || '').split('\n').filter(Boolean)
  const benefitList = Array.isArray(benefits) ? benefits : String(benefits || '').split('\n').filter(Boolean)
  const specList = Array.isArray(specs) ? specs : String(specs || '').split('\n').filter(Boolean)

  const html = `<div class="product-description">
  <p><strong>${productName}</strong> — ${audience ? `Perfect for ${audience}.` : 'A premium product designed for quality.'}</p>
  ${benefitList.length ? `<h3>Why You'll Love It</h3><ul>${benefitList.map((b: string) => `<li>${b}</li>`).join('')}</ul>` : ''}
  ${featureList.length ? `<h3>Key Features</h3><ul>${featureList.map((f: string) => `<li>${f}</li>`).join('')}</ul>` : ''}
  ${specList.length ? `<h3>Specifications</h3><ul>${specList.map((s: string) => `<li>${s}</li>`).join('')}</ul>` : ''}
  <p>Order today and experience the difference. <strong>30-day satisfaction guarantee.</strong></p>
</div>`
  return { html, wordCount: html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length }
}

// 12. Schema Generator — JSON-LD product schema
function schemaGenerator(body: Record<string, unknown>) {
  const { product } = body as { product: Record<string, string> }
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title || '',
    description: stripHtml(product.description || '').slice(0, 500),
    sku: product.sku || '',
    brand: { '@type': 'Brand', name: product.vendor || '' },
    image: [product.imageUrl, product.imageUrl2, product.imageUrl3].filter(Boolean),
    offers: {
      '@type': 'Offer',
      price: product.price || '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: product.vendor || 'Seller' },
    },
    ...(product.seoKeywords && { keywords: product.seoKeywords }),
  }
  return { schema, json: JSON.stringify(schema, null, 2) }
}

// 13. Find & Replace in DB
async function dbFindReplace(body: Record<string, unknown>, userId: string) {
  const { find, replace, fields = ['title'], statusFilter } = body
  if (!find) return { error: 'find required' }
  const regex = new RegExp(String(find).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
  const where = { userId, ...(statusFilter ? { status: String(statusFilter) } : {}) }
  const products = await prisma.product.findMany({ where })
  let updated = 0
  for (const p of products) {
    const data: Record<string, string> = {}
    let changed = false
    if ((fields as string[]).includes('title') && p.title) {
      const n = p.title.replace(regex, String(replace)); if (n !== p.title) { data.title = n; changed = true }
    }
    if ((fields as string[]).includes('description') && p.description) {
      const n = p.description.replace(regex, String(replace)); if (n !== p.description) { data.description = n; changed = true }
    }
    if ((fields as string[]).includes('tags') && p.tags) {
      const n = p.tags.replace(regex, String(replace)); if (n !== p.tags) { data.tags = n; changed = true }
    }
    if (changed) { await prisma.product.update({ where: { id: p.id }, data }); updated++ }
  }
  return { success: true, updated, total: products.length, find, replace }
}

// 14. Clone Product
async function cloneProduct(body: Record<string, unknown>, userId: string) {
  const { productId, suffix = '(Copy)' } = body
  const p = await prisma.product.findFirst({ where: { id: Number(productId), userId } })
  if (!p) return { error: 'Product not found' }
  const { id: _, createdAt: __, updatedAt: ___, ...rest } = p
  const cloned = await prisma.product.create({ data: { ...rest, title: `${p.title} ${suffix}`, sku: p.sku ? `${p.sku}-COPY` : '', status: 'draft' } })
  return { success: true, cloned: { id: cloned.id, title: cloned.title } }
}

// 15. Listing Comparison
async function compareListings(body: Record<string, unknown>, userId: string) {
  const { productIds } = body
  if (!Array.isArray(productIds) || productIds.length < 2) return { error: 'At least 2 productIds required' }
  const products = await prisma.product.findMany({ where: { id: { in: productIds.map(Number) }, userId } })
  const compared = products.map(p => ({
    id: p.id, title: p.title, titleLen: p.title?.length || 0,
    descLen: stripHtml(p.description || '').length,
    bulletCount: p.bulletPoints?.split('\n').filter(Boolean).length || 0,
    kwCount: p.seoKeywords?.split(',').filter(Boolean).length || 0,
    metaLen: p.metaDescription?.length || 0,
    hasImage: !!p.imageUrl, hasSku: !!p.sku, hasVendor: !!p.vendor,
    seoScore: p.seoScore || 0, seoGrade: p.seoGrade || '—',
  }))
  return { products: compared, winner: compared.reduce((a, b) => a.seoScore > b.seoScore ? a : b) }
}

// 16. Review Analyzer — analyze product reviews to improve listing
async function reviewAnalyzer(body: Record<string, unknown>) {
  const { reviews, productName, provider, apiKey } = body
  if (!Array.isArray(reviews) || !reviews.length) return { error: 'reviews array required' }
  const prompt = `Analyze these customer reviews for "${productName}" and extract insights to improve the product listing.
Reviews: ${(reviews as string[]).slice(0, 10).join('\n---\n')}

Return JSON: {"positive_themes":["..."],"negative_themes":["..."],"listing_improvements":["..."],"keywords_customers_use":["..."],"sentiment":"positive|neutral|negative"}`
  try {
    const raw = await callAI({ provider: String(provider), apiKey: String(apiKey) }, prompt, { temperature: 0.4, maxTokens: 600 })
    const m = raw.match(/\{[\s\S]*\}/)
    return { analysis: m ? JSON.parse(m[0]) : {}, reviewCount: reviews.length }
  } catch (e: unknown) { return { error: e instanceof Error ? e.message : String(e) } }
}

// 17. Health Score Dashboard
async function healthScore(body: Record<string, unknown>, userId: string) {
  const { status, categoryId } = body
  const where = { userId, ...(status ? { status: String(status) } : {}), ...(categoryId ? { categoryId: Number(categoryId) } : {}) }
  const products = await prisma.product.findMany({ where, take: 500 })
  const scores = products.map(p => {
    let s = 0
    if (p.title && p.title.length >= 30) s += 20
    if (p.description && stripHtml(p.description).length >= 200) s += 20
    if (p.bulletPoints && p.bulletPoints.split('\n').filter(Boolean).length >= 5) s += 20
    if (p.seoKeywords && p.seoKeywords.split(',').filter(Boolean).length >= 5) s += 15
    if (p.metaDescription && p.metaDescription.length >= 50) s += 10
    if (p.imageUrl) s += 10
    if (p.sku) s += 3
    if (p.price) s += 2
    return { id: p.id, title: p.title, score: s }
  })
  const excellent = scores.filter(s => s.score >= 85).length
  const good = scores.filter(s => s.score >= 70 && s.score < 85).length
  const needsWork = scores.filter(s => s.score < 70).length
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length) : 0
  return { avgScore, excellent, good, needsWork, total: products.length, distribution: { A: excellent, B: good, C: needsWork } }
}

// 18. Keyword Planner — plan keyword strategy per category
async function keywordPlanner(body: Record<string, unknown>) {
  const { category, niche, platform = 'shopify', provider, apiKey } = body
  const prompt = `You are an ecommerce SEO expert. Create a keyword strategy for the "${category}" category in the "${niche || category}" niche for ${platform}.

Return JSON:
{
  "primary_keywords": ["5-8 high-volume, high-intent keywords"],
  "secondary_keywords": ["10-15 medium-volume keywords"],
  "longtail_keywords": ["15-20 specific longtail phrases"],
  "negative_keywords": ["5-10 keywords to avoid"],
  "title_formulas": ["3 title formulas that work well"],
  "content_tips": ["5 SEO tips specific to this category"]
}`
  try {
    const raw = await callAI({ provider: String(provider), apiKey: String(apiKey) }, prompt, { temperature: 0.6, maxTokens: 800 })
    const m = raw.match(/\{[\s\S]*\}/)
    return { plan: m ? JSON.parse(m[0]) : {}, category, platform }
  } catch (e: unknown) { return { error: e instanceof Error ? e.message : String(e) } }
}

// 19. Import URL — scrape and import product directly to DB
async function importFromUrl(body: Record<string, unknown>, userId: string) {
  const { url, proxy } = body
  if (!url) return { error: 'url required' }
  // Call Python scraper
  try {
    const res = await fetch('http://localhost:5001/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, proxy, playwright: true }),
      signal: AbortSignal.timeout(30000),
    })
    const data = await res.json()
    if (data.error) return { error: data.error }
    const product = await prisma.product.create({
      data: {
        userId, title: data.title || '', price: data.price ? parseFloat(data.price) : null,
        vendor: data.brand || '', description: data.description || '',
        bulletPoints: Array.isArray(data.bullets) ? data.bullets.join('\n') : '',
        seoKeywords: data.keywords || '', imageUrl: data.images?.[0] || '',
        sourceUrl: String(url), sourceMarketplace: data.detected_marketplace || '',
        tags: data.keywords || '', status: 'draft',
      },
    })
    return { success: true, product: { id: product.id, title: product.title }, scraped: data }
  } catch (e: unknown) {
    // Fallback to Node scraper
    return { error: e instanceof Error ? e.message : String(e), tip: 'Start the Python scraper: python python-scraper/scraper.py' }
  }
}

// 20. Style Presets — save/load AI writing style presets (stored in Redis)
async function stylePresets(body: Record<string, unknown>, userId: string) {
  const { action, name, preset } = body
  const key = `style-presets:${userId}`
  if (action === 'save') {
    const existing: Record<string, unknown> = await getCache(key) || {}
    existing[String(name)] = preset
    await setCache(key, existing, 86400 * 365)
    return { success: true, saved: name }
  }
  if (action === 'delete') {
    const existing: Record<string, unknown> = await getCache(key) || {}
    delete existing[String(name)]
    await setCache(key, existing, 86400 * 365)
    return { success: true, deleted: name }
  }
  const presets = await getCache(key) || {}
  return { presets }
}

// 21. Bulk Pipeline — move multiple products through stages
async function bulkPipeline(body: Record<string, unknown>, userId: string) {
  const { productIds, fromStatus, toStatus } = body
  if (!toStatus) return { error: 'toStatus required' }
  const where = { userId, ...(Array.isArray(productIds) && productIds.length ? { id: { in: productIds.map(Number) } } : fromStatus ? { status: String(fromStatus) } : {}) }
  const result = await prisma.product.updateMany({ where, data: { status: String(toStatus) } })
  return { success: true, updated: result.count, toStatus }
}

// 22. Price Intelligence — analyze pricing strategy
async function priceIntel(body: Record<string, unknown>, userId: string) {
  const { categoryId, priceMin, priceMax } = body
  const where = { userId, ...(categoryId ? { categoryId: Number(categoryId) } : {}), price: { not: null } }
  const products = await prisma.product.findMany({ where, select: { id: true, title: true, price: true, type: true } })
  const prices = products.map(p => parseFloat(String(p.price || 0))).filter(p => p > 0)
  if (!prices.length) return { error: 'No products with prices found' }
  const sorted = [...prices].sort((a, b) => a - b)
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length
  const median = sorted[Math.floor(sorted.length / 2)]
  const pRanges = [
    { range: '<$10', count: prices.filter(p => p < 10).length },
    { range: '$10-$25', count: prices.filter(p => p >= 10 && p < 25).length },
    { range: '$25-$50', count: prices.filter(p => p >= 25 && p < 50).length },
    { range: '$50-$100', count: prices.filter(p => p >= 50 && p < 100).length },
    { range: '>$100', count: prices.filter(p => p >= 100).length },
  ]
  return {
    stats: { avg: parseFloat(avg.toFixed(2)), median, min: sorted[0], max: sorted[sorted.length - 1], count: prices.length },
    priceRanges: pRanges,
    recommendation: avg < 20 ? 'Consider premium positioning' : avg > 100 ? 'Ensure value proposition is clear' : 'Good price range for conversions',
  }
}

// 23. Export History
async function exportHistory(_body: Record<string, unknown>, userId: string) {
  const history = await prisma.exportHistory.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 })
  return { history, total: history.length }
}

// 24. Merge Products — merge two products keeping best fields
async function mergeProducts(body: Record<string, unknown>, userId: string) {
  const { primaryId, secondaryId } = body
  const [primary, secondary] = await Promise.all([
    prisma.product.findFirst({ where: { id: Number(primaryId), userId } }),
    prisma.product.findFirst({ where: { id: Number(secondaryId), userId } }),
  ])
  if (!primary || !secondary) return { error: 'Products not found' }
  // Keep best fields from each
  const merged = {
    title: primary.title || secondary.title,
    description: (primary.description?.length || 0) > (secondary.description?.length || 0) ? primary.description : secondary.description,
    bulletPoints: (primary.bulletPoints?.length || 0) > (secondary.bulletPoints?.length || 0) ? primary.bulletPoints : secondary.bulletPoints,
    seoKeywords: [...new Set([...(primary.seoKeywords?.split(',') || []), ...(secondary.seoKeywords?.split(',') || [])].map(k => k.trim()).filter(Boolean))].join(', '),
    imageUrl: primary.imageUrl || secondary.imageUrl,
    imageUrl2: primary.imageUrl2 || secondary.imageUrl2,
    price: primary.price || secondary.price,
    sku: primary.sku || secondary.sku,
    vendor: primary.vendor || secondary.vendor,
    tags: [...new Set([...(primary.tags?.split(',') || []), ...(secondary.tags?.split(',') || [])].filter(Boolean))].join(', '),
  }
  await prisma.product.update({ where: { id: primary.id }, data: merged })
  await prisma.product.delete({ where: { id: secondary.id } })
  return { success: true, merged: { id: primary.id, title: merged.title }, deletedId: secondary.id }
}

// ── MAIN ROUTE HANDLER ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // General rate limit
  const allowed = await checkRateLimit(`tools:${user.id}`, 100, 60)
  if (!allowed) return NextResponse.json({ error: 'Rate limit: 100 tool calls per minute' }, { status: 429 })

  const body = await req.json()
  const { tool, ...params } = body

  try {
    let result: unknown
    switch (tool) {
      case 'bulk-rewrite':       result = await bulkRewrite(params, user.id, clerkId); break
      case 'seo-analyze':        result = await seoAnalyze(params, user.id); break
      case 'auto-classify':      result = await autoClassify(params, user.id); break
      case 'tag-extractor':      result = tagExtractor(params); break
      case 'keyword-density':    result = keywordDensity(params); break
      case 'listing-preview':    result = listingPreview(params); break
      case 'bundle-suggest':     result = await bundleSuggest(params, user.id); break
      case 'margin-calc':        result = marginCalc(params); break
      case 'inventory-alerts':   result = await inventoryAlerts(params, user.id); break
      case 'bullet-optimizer':   result = await bulletOptimizer(params); break
      case 'description-builder':result = descriptionBuilder(params); break
      case 'schema-generator':   result = schemaGenerator(params); break
      case 'find-replace':       result = await dbFindReplace(params, user.id); break
      case 'clone-product':      result = await cloneProduct(params, user.id); break
      case 'compare-listings':   result = await compareListings(params, user.id); break
      case 'review-analyzer':    result = await reviewAnalyzer(params); break
      case 'health-score':       result = await healthScore(params, user.id); break
      case 'keyword-planner':    result = await keywordPlanner(params); break
      case 'import-url':         result = await importFromUrl(params, user.id); break
      case 'style-presets':      result = await stylePresets(params, user.id); break
      case 'bulk-pipeline':      result = await bulkPipeline(params, user.id); break
      case 'price-intel':        result = await priceIntel(params, user.id); break
      case 'export-history':     result = await exportHistory(params, user.id); break
      case 'merge-products':     result = await mergeProducts(params, user.id); break
      default: return NextResponse.json({ error: `Unknown tool: ${tool}. Available: bulk-rewrite, seo-analyze, auto-classify, tag-extractor, keyword-density, listing-preview, bundle-suggest, margin-calc, inventory-alerts, bullet-optimizer, description-builder, schema-generator, find-replace, clone-product, compare-listings, review-analyzer, health-score, keyword-planner, import-url, style-presets, bulk-pipeline, price-intel, export-history, merge-products` }, { status: 400 })
    }
    return NextResponse.json({ success: true, tool, result })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e), tool }, { status: 500 })
  }
}

// GET /api/tools — list all available tools
export async function GET() {
  return NextResponse.json({
    tools: [
      { id:'bulk-rewrite', name:'Bulk AI Rewrite', category:'AI', desc:'AI rewrites titles/descriptions in batch', params:['productIds','field','platform','provider','apiKey'] },
      { id:'seo-analyze', name:'SEO Analyzer', category:'SEO', desc:'Per-product SEO score with specific fixes', params:['productIds'] },
      { id:'auto-classify', name:'Auto-Classify', category:'AI', desc:'AI assigns categories to products automatically', params:['productIds','provider','apiKey'] },
      { id:'tag-extractor', name:'Tag Extractor', category:'SEO', desc:'Extract relevant tags from product descriptions', params:['texts','maxTags'] },
      { id:'keyword-density', name:'Keyword Density', category:'SEO', desc:'Analyze keyword frequency in product content', params:['text','keywords'] },
      { id:'listing-preview', name:'Listing Preview', category:'Tools', desc:'HTML preview of listing on Shopify or Amazon', params:['product','platform'] },
      { id:'bundle-suggest', name:'Bundle Suggester', category:'AI', desc:'AI suggests product bundle combinations', params:['productIds','provider','apiKey'] },
      { id:'margin-calc', name:'Margin Calculator', category:'Pricing', desc:'Calculate profit margin, ROI for products', params:['products'] },
      { id:'inventory-alerts', name:'Inventory Alerts', category:'Operations', desc:'Flag low/zero quantity products', params:['threshold'] },
      { id:'bullet-optimizer', name:'Bullet Optimizer', category:'AI', desc:'AI reorders and improves bullet points', params:['bullets','productName','platform','provider','apiKey'] },
      { id:'description-builder', name:'Description Builder', category:'Tools', desc:'Build structured HTML description from features', params:['productName','features','benefits','specs'] },
      { id:'schema-generator', name:'Schema Generator', category:'SEO', desc:'Generate JSON-LD product schema markup', params:['product'] },
      { id:'find-replace', name:'Find & Replace', category:'Operations', desc:'Bulk find & replace across all DB products', params:['find','replace','fields'] },
      { id:'clone-product', name:'Clone Product', category:'Operations', desc:'Clone a product for variations', params:['productId','suffix'] },
      { id:'compare-listings', name:'Compare Listings', category:'Analytics', desc:'Side-by-side listing comparison and winner', params:['productIds'] },
      { id:'review-analyzer', name:'Review Analyzer', category:'AI', desc:'Analyze customer reviews to improve listings', params:['reviews','productName','provider','apiKey'] },
      { id:'health-score', name:'Health Score Dashboard', category:'Analytics', desc:'Overall listing health across your catalogue', params:['status','categoryId'] },
      { id:'keyword-planner', name:'Keyword Planner', category:'SEO', desc:'Plan keyword strategy per category', params:['category','niche','platform','provider','apiKey'] },
      { id:'import-url', name:'Import from URL', category:'Scraper', desc:'Scrape and import product directly to DB', params:['url','proxy'] },
      { id:'style-presets', name:'Style Presets', category:'AI', desc:'Save and reuse custom AI writing styles', params:['action','name','preset'] },
      { id:'bulk-pipeline', name:'Bulk Pipeline', category:'Operations', desc:'Move multiple products through pipeline stages', params:['productIds','toStatus'] },
      { id:'price-intel', name:'Price Intelligence', category:'Pricing', desc:'Price distribution and strategy analysis', params:['categoryId'] },
      { id:'export-history', name:'Export History', category:'Export', desc:'Full export history with timestamps', params:[] },
      { id:'merge-products', name:'Merge Products', category:'Operations', desc:'Merge duplicate products keeping best fields', params:['primaryId','secondaryId'] },
    ],
    total: 24,
  })
}
