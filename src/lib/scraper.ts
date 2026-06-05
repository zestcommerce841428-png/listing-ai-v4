/**
 * ListingAI — Universal Marketplace Scraper with Playwright support
 * Handles: Amazon, eBay, AliExpress, Etsy, Flipkart, Walmart + any site
 * Uses Playwright for JS-heavy sites, Cheerio for fast static scraping
 */

import * as cheerio from 'cheerio'

export interface ScrapedProduct {
  title: string
  price: string
  brand: string
  description: string
  bullets: string[]
  images: string[]
  keywords: string
  category: string
  rating?: string
  reviewCount?: string
  asin?: string
  source_url: string
  detected_marketplace: string
}

const UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
]

let _uaIdx = 0
function getUA() { return UA_POOL[_uaIdx++ % UA_POOL.length] }

export function detectMarketplace(url: string): string {
  const u = url.toLowerCase()
  if (u.includes('amazon.')) return 'amazon'
  if (u.includes('ebay.')) return 'ebay'
  if (u.includes('aliexpress.')) return 'aliexpress'
  if (u.includes('alibaba.')) return 'alibaba'
  if (u.includes('etsy.')) return 'etsy'
  if (u.includes('flipkart.')) return 'flipkart'
  if (u.includes('walmart.')) return 'walmart'
  if (u.includes('myntra.')) return 'myntra'
  if (u.includes('meesho.')) return 'meesho'
  return 'generic'
}

async function fetchHTML(url: string, proxyUrl?: string, delayMs = 800): Promise<string> {
  if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs + Math.random() * 400))

  const headers: Record<string, string> = {
    'User-Agent': getUA(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Referer': 'https://www.google.com/',
    'Cache-Control': 'max-age=0',
  }

  // Use Playwright for JS-heavy sites or when explicitly requested
  const needsPlaywright = url.includes('aliexpress') || url.includes('alibaba') || url.includes('amazon')

  if (needsPlaywright) {
    return fetchWithPlaywright(url, headers)
  }

  const res = await fetch(url, { headers, redirect: 'follow' })
  return res.text()
}

async function fetchWithPlaywright(url: string, headers: Record<string, string>): Promise<string> {
  // Dynamic import — only loads when needed
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled'],
  })
  const context = await browser.newContext({
    userAgent: headers['User-Agent'],
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
    viewport: { width: 1366, height: 768 },
  })

  // Anti-detection: hide webdriver flag
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
  })

  const page = await context.newPage()
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(2000 + Math.random() * 1500)
    const html = await page.content()
    await browser.close()
    return html
  } catch (err) {
    await browser.close()
    throw err
  }
}

function parseAmazon($: ReturnType<typeof cheerio.load>, url: string): ScrapedProduct {
  const title = $('#productTitle').text().trim() || $('h1.a-size-large').text().trim()
  const price = ($('.a-price .a-offscreen').first().text() || $('#price_inside_buybox').text()).trim()
  const brand = $('#bylineInfo').text().replace(/Visit the|Store/gi, '').trim() || $('[class*="brand"]').first().text().trim()
  const rating = $('#acrPopover').attr('title') || $('[data-hook="rating-out-of-text"]').text().trim()
  const reviewCount = $('#acrCustomerReviewText').text().trim()
  const bullets: string[] = []
  $('#feature-bullets li span:not(.aok-hidden)').each((_, el) => {
    const t = $(el).text().trim()
    if (t.length > 10 && !t.includes('Make sure')) bullets.push(t)
  })
  const description = $('#productDescription p').first().text().trim().slice(0, 600) || $('meta[name="description"]').attr('content') || ''
  const images: string[] = []
  $('img[data-old-hires]').each((_, el) => { const s = $(el).attr('data-old-hires'); if (s && !images.includes(s)) images.push(s) })
  if (!images.length) $('[class*="imgTagWrapper"] img').each((_, el) => { const s = $(el).attr('src'); if (s?.includes('http') && !images.includes(s)) images.push(s) })
  const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/)
  const category = $('#wayfinding-breadcrumbs_feature_div a').map((_, el) => $(el).text().trim()).get().join(' > ')
  const keywords = $('meta[name="keywords"]').attr('content') || ''
  return { title, price: price.replace(/[^\d.]/g, ''), brand, description, bullets: bullets.slice(0, 5), images: images.slice(0, 8), keywords, category, rating, reviewCount, asin: asinMatch?.[1], source_url: url, detected_marketplace: 'amazon' }
}

function parseEbay($: ReturnType<typeof cheerio.load>, url: string): ScrapedProduct {
  const title = $('h1.x-item-title__mainTitle span').text().trim() || $('h1').first().text().trim()
  const price = ($('[itemprop="price"]').attr('content') || $('.x-price-primary').text()).trim()
  const brand = $('[class*="x-sellercard"]').first().text().trim()
  const description = $('#desc_div').text().trim().slice(0, 500)
  const images: string[] = []
  $('[class*="img-container"] img,[class*="x-img"] img,#icImg').each((_, el) => { const s = $(el).attr('src'); if (s?.includes('http') && !images.includes(s)) images.push(s) })
  const category = $('[class*="breadcrumb"] a').map((_, el) => $(el).text().trim()).get().filter(Boolean).join(' > ')
  return { title, price: price.replace(/[^\d.]/g, ''), brand, description, bullets: [], images: images.slice(0, 8), keywords: title, category, source_url: url, detected_marketplace: 'ebay' }
}

function parseGeneric($: ReturnType<typeof cheerio.load>, url: string, marketplace: string): ScrapedProduct {
  const title = $('h1').first().text().trim() || $('[class*="product-title"],[itemprop="name"]').first().text().trim() || $('title').text().split('|')[0].trim()
  const priceRaw = $('[itemprop="price"]').attr('content') || $('[class*="price"]').first().text().trim() || ''
  const price = priceRaw.replace(/[^\d.]/g, '')
  const brand = $('[itemprop="brand"]').text().trim() || $('[class*="brand"]').first().text().trim() || ''
  const description = ($('[itemprop="description"]').text() || $('[class*="description"]').first().text() || $('meta[name="description"]').attr('content') || '').slice(0, 500).trim()
  const bullets: string[] = []
  $('[class*="feature"] li,[class*="spec"] li,[class*="highlight"] li,[class*="bullet"] li').each((_, el) => { const t = $(el).text().trim(); if (t.length > 5 && bullets.length < 5) bullets.push(t) })
  const images: string[] = []
  $('img').each((_, el) => {
    const s = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src') || ''
    if (s.match(/\.(jpg|jpeg|png|webp)/i) && !s.includes('icon') && !s.includes('logo') && images.length < 8) {
      try { const full = s.startsWith('http') ? s : new URL(s, url).href; if (!images.includes(full)) images.push(full) } catch {}
    }
  })
  const keywords = $('meta[name="keywords"]').attr('content') || ''
  const category = $('[class*="breadcrumb"] a').map((_, el) => $(el).text().trim()).get().filter(Boolean).join(' > ')
  return { title, price, brand, description, bullets, images, keywords, category, source_url: url, detected_marketplace: marketplace }
}

export async function scrapeProduct(url: string, proxyUrl?: string, delayMs = 800): Promise<ScrapedProduct> {
  const marketplace = detectMarketplace(url)
  const html = await fetchHTML(url, proxyUrl, delayMs)
  const $ = cheerio.load(html)

  switch (marketplace) {
    case 'amazon': return parseAmazon($, url)
    case 'ebay': return parseEbay($, url)
    default: return parseGeneric($, url, marketplace)
  }
}

export interface BatchScrapeResult {
  url: string
  status: 'success' | 'error'
  data?: ScrapedProduct
  error?: string
}

export async function batchScrape(
  urls: string[],
  options: { proxy?: string; delay?: number; onProgress?: (idx: number, total: number, result: BatchScrapeResult) => void } = {}
): Promise<BatchScrapeResult[]> {
  const results: BatchScrapeResult[] = []
  const delay = options.delay ?? 1200

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i].trim()
    if (!url) continue
    try {
      const data = await scrapeProduct(url, options.proxy, i === 0 ? 0 : delay)
      const result: BatchScrapeResult = { url, status: 'success', data }
      results.push(result)
      options.onProgress?.(i + 1, urls.length, result)
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : String(e)
      const result: BatchScrapeResult = { url, status: 'error', error: err }
      results.push(result)
      options.onProgress?.(i + 1, urls.length, result)
    }
  }
  return results
}
