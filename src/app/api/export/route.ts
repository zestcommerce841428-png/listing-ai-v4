import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { stringify } from 'csv-stringify/sync'

function buildShopifyRows(listings: Record<string, unknown>[]) {
  return listings.map(l => ({
    Handle: String(l.title || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '').slice(0, 255),
    Title: l.title || '',
    'Body (HTML)': l.description || '',
    Vendor: l.vendor || '',
    Type: l.type || '',
    Tags: l.tags || '',
    Published: 'TRUE',
    'Option1 Name': 'Title',
    'Option1 Value': 'Default Title',
    'Variant SKU': l.sku || '',
    'Variant Price': l.price || '',
    'Variant Compare At Price': l.comparePrice || '',
    'Variant Requires Shipping': 'TRUE',
    'Variant Taxable': 'TRUE',
    'Variant Weight Unit': 'kg',
    'Image Src': l.imageUrl || '',
    'Image Alt Text': l.altText || l.title || '',
    'SEO Title': l.title || '',
    'SEO Description': l.metaDescription || '',
    Status: 'active',
  }))
}

function buildAmazonRows(listings: Record<string, unknown>[]) {
  return listings.map(l => {
    const bp = typeof l.bulletPoints === 'string' ? l.bulletPoints.split('\n') : (Array.isArray(l.bulletPoints) ? l.bulletPoints : [])
    return {
      feed_product_type: l.type || 'Health',
      item_sku: l.sku || '',
      brand_name: l.vendor || '',
      item_name: l.title || '',
      item_description: String(l.description || '').replace(/<[^>]+>/g, '').slice(0, 2000),
      bullet_point1: bp[0] || '',
      bullet_point2: bp[1] || '',
      bullet_point3: bp[2] || '',
      bullet_point4: bp[3] || '',
      bullet_point5: bp[4] || '',
      standard_price: l.price || '',
      quantity: l.quantity || '100',
      main_image_url: l.imageUrl || '',
      search_terms: l.seoKeywords || l.tags || '',
      generic_keywords: l.tags || '',
      product_type: l.type || '',
      is_adult_product: 'false',
    }
  })
}

function buildWooRows(listings: Record<string, unknown>[]) {
  return listings.map(l => ({
    ID: '',
    Type: 'simple',
    SKU: l.sku || '',
    Name: l.title || '',
    Published: '1',
    'Is featured?': '0',
    'Visibility in catalog': 'visible',
    'Short description': String(l.description || '').replace(/<[^>]+>/g, ' ').slice(0, 200),
    Description: l.description || '',
    'Tax status': 'taxable',
    'In stock?': '1',
    Stock: l.quantity || '100',
    'Regular price': l.price || '',
    'Sale price': '',
    Categories: l.type || '',
    Tags: l.tags || '',
    Images: l.imageUrl || '',
    'Meta: _yoast_wpseo_title': l.title || '',
    'Meta: _yoast_wpseo_metadesc': l.metaDescription || '',
  }))
}

// POST /api/export — export products as CSV
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { platform, ids, status } = await req.json()
  if (!platform) return NextResponse.json({ error: 'platform required' }, { status: 400 })

  // Fetch products
  const where = { userId: user.id, ...(ids?.length ? { id: { in: ids.map(Number) } } : status ? { status } : {}) }
  const products = await prisma.product.findMany({ where, orderBy: { updatedAt: 'desc' }, take: 10000 })

  if (!products.length) return NextResponse.json({ error: 'No products found' }, { status: 404 })

  const listings = products.map(p => ({
    ...p,
    bulletPoints: p.bulletPoints || '',
    seoKeywords: p.seoKeywords || '',
    imageUrl: p.imageUrl || '',
    metaDescription: p.metaDescription || '',
    price: p.price?.toString() || '',
    comparePrice: p.comparePrice?.toString() || '',
  }))

  let csvData: string
  let filename: string

  if (platform === 'shopify') {
    csvData = stringify(buildShopifyRows(listings as unknown as Record<string, unknown>[]), { header: true })
    filename = 'shopify_products.csv'
  } else if (platform === 'amazon') {
    csvData = stringify(buildAmazonRows(listings as unknown as Record<string, unknown>[]), { header: true })
    filename = 'amazon_flat_file.csv'
  } else if (platform === 'woocommerce') {
    csvData = stringify(buildWooRows(listings as unknown as Record<string, unknown>[]), { header: true })
    filename = 'woocommerce_products.csv'
  } else {
    return NextResponse.json({ error: 'Unknown platform. Use: shopify, amazon, woocommerce' }, { status: 400 })
  }

  // Log export
  await prisma.exportHistory.create({ data: { userId: user.id, platform, rowCount: products.length, filename } }).catch(() => {})

  return new Response(csvData, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache',
    },
  })
}
