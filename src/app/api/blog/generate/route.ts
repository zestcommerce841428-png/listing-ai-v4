import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { callAI } from '@/lib/ai'
import { delCachePattern } from '@/lib/redis'

const BLOG_CATEGORIES = [
  'Ecommerce Strategy', 'Amazon Selling', 'Shopify Tips', 'Product Listing SEO',
  'AI in Ecommerce', 'Dropshipping', 'Product Photography', 'Pricing Strategy',
  'WooCommerce', 'eBay Selling', 'Etsy Tips', 'Social Commerce',
  'Inventory Management', 'Customer Reviews', 'Ecommerce Analytics', 'Email Marketing',
]

const BLOG_TOPICS = [
  'How to write product descriptions that sell',
  'Amazon listing optimization complete guide',
  'Best AI tools for ecommerce in {year}',
  'How to do keyword research for product listings',
  'Shopify SEO: complete beginner guide',
  'How to rank higher in Amazon search',
  'Writing bullet points that convert',
  'Product title optimization guide',
  'How to use ChatGPT for product descriptions',
  'Ecommerce photography tips for beginners',
  'How to price products on Amazon',
  'WooCommerce SEO checklist',
  'How to write meta descriptions for products',
  'Bulk listing management strategies',
  'How to scale from 100 to 10000 listings',
  'Cross-platform selling: Amazon + Shopify + Etsy',
  'Product research tools comparison',
  'How to find winning products in {year}',
  'Dropshipping listing optimization',
  'eBay listing best practices',
]

// POST /api/blog/generate — AI generates a blog post
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { topic, category, provider = 'groq', apiKey, count = 1 } = await req.json()
  if (!apiKey && provider !== 'ollama') return NextResponse.json({ error: 'API key required' }, { status: 400 })

  const results = []
  const maxCount = Math.min(count, 10)

  for (let i = 0; i < maxCount; i++) {
    const postTopic = topic || BLOG_TOPICS[Math.floor(Math.random() * BLOG_TOPICS.length)].replace('{year}', new Date().getFullYear().toString())
    const postCategory = category || BLOG_CATEGORIES[Math.floor(Math.random() * BLOG_CATEGORIES.length)]

    const prompt = `Write a comprehensive, SEO-optimised blog post for an ecommerce listing automation tool called ListingAI.

Topic: "${postTopic}"
Category: ${postCategory}
Target audience: Ecommerce managers, online sellers, Shopify/Amazon store owners

Requirements:
- Title: SEO-friendly, 50-70 chars, include primary keyword
- Excerpt: Compelling 150-200 char summary
- Content: 800-1200 words, structured with H2/H3 headings using ## and ###, bullet points with -, practical tips
- Include 2-3 mentions of how AI tools (like ListingAI) can help
- End with a CTA to try ListingAI
- Tags: 5-8 relevant comma-separated keywords
- Read time: estimate in minutes
- SEO description: 155 chars

Return ONLY valid JSON (no markdown, no code blocks):
{"title":"...","excerpt":"...","content":"...","tags":"...","readTime":5,"seoTitle":"...","seoDescription":"..."}`

    try {
      const raw = await callAI({ provider, apiKey: apiKey || '' }, prompt, { temperature: 0.8, maxTokens: 2000 })
      const m = raw.match(/\{[\s\S]*\}/)
      if (!m) throw new Error('No JSON in response')
      const data = JSON.parse(m[0])

      // Find or create category
      let catId: number | null = null
      const existingCat = await prisma.blogCategory.findFirst({ where: { name: postCategory } })
      if (existingCat) {
        catId = existingCat.id
      } else {
        const newCat = await prisma.blogCategory.create({
          data: { name: postCategory, slug: postCategory.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, ''), icon: '📝', color: '#6366f1' }
        })
        catId = newCat.id
      }

      // Create unique slug
      const baseSlug = data.title.toLowerCase().replace(/[^a-z0-9\s\-]/g, '').replace(/\s+/g, '-').slice(0, 80)
      const slug = `${baseSlug}-${Date.now()}`

      const post = await prisma.blogPost.create({
        data: {
          title: data.title, slug, excerpt: data.excerpt, content: data.content,
          categoryId: catId, tags: data.tags, authorName: 'ListingAI Team',
          status: 'published', readTime: data.readTime || 5, featured: false,
          seoTitle: data.seoTitle || data.title, seoDescription: data.seoDescription || data.excerpt,
          publishedAt: new Date(),
        },
      })

      if (catId) {
        await prisma.blogCategory.update({ where: { id: catId }, data: { postCount: { increment: 1 } } })
      }

      results.push({ success: true, post: { id: post.id, title: post.title, slug: post.slug } })
    } catch (e: unknown) {
      results.push({ success: false, topic: postTopic, error: e instanceof Error ? e.message : String(e) })
    }
  }

  await delCachePattern('blog:*')
  return NextResponse.json({ results, generated: results.filter(r => r.success).length })
}
