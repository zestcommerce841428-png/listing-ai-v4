#!/usr/bin/env python3
"""
ListingAI Python Scraper Microservice
Runs on port 5001 — called by Next.js /api/scrape when JS fails
Uses: Playwright (primary) → Selenium (fallback) → requests+BS4 (fast fallback)
"""
import os
import re
import time
import random
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from bs4 import BeautifulSoup
import requests

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'])

# ── User agent pool ────────────────────────────────────────────────────────────
UA_POOL = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
]

def get_ua():
    return random.choice(UA_POOL)

def detect_marketplace(url: str) -> str:
    url_l = url.lower()
    if 'amazon.' in url_l: return 'amazon'
    if 'ebay.' in url_l: return 'ebay'
    if 'aliexpress.' in url_l: return 'aliexpress'
    if 'alibaba.' in url_l: return 'alibaba'
    if 'etsy.' in url_l: return 'etsy'
    if 'flipkart.' in url_l: return 'flipkart'
    if 'walmart.' in url_l: return 'walmart'
    if 'myntra.' in url_l: return 'myntra'
    if 'meesho.' in url_l: return 'meesho'
    return 'generic'

# ── Strategy 1: Playwright (handles JS-heavy sites) ────────────────────────────
async def scrape_with_playwright(url: str, proxy: str = None) -> str:
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        browser_args = [
            '--no-sandbox', '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled',
            '--disable-infobars', '--window-size=1366,768',
        ]
        launch_opts = {'headless': True, 'args': browser_args}
        if proxy:
            launch_opts['proxy'] = {'server': proxy}

        browser = await p.chromium.launch(**launch_opts)
        context = await browser.new_context(
            user_agent=get_ua(),
            viewport={'width': 1366, 'height': 768},
            extra_http_headers={
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
        )
        # Anti-detection
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3]});
            window.chrome = {runtime: {}};
        """)
        page = await context.new_page()
        try:
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
            await page.wait_for_timeout(random.randint(1500, 3000))
            html = await page.content()
            return html
        finally:
            await browser.close()

# ── Strategy 2: Selenium ChromeDriver ─────────────────────────────────────────
def scrape_with_selenium(url: str) -> str:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service
    from webdriver_manager.chrome import ChromeDriverManager

    opts = Options()
    opts.add_argument('--headless=new')
    opts.add_argument('--no-sandbox')
    opts.add_argument('--disable-dev-shm-usage')
    opts.add_argument('--disable-blink-features=AutomationControlled')
    opts.add_argument(f'--user-agent={get_ua()}')
    opts.add_experimental_option('excludeSwitches', ['enable-automation'])
    opts.add_experimental_option('useAutomationExtension', False)

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=opts)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    try:
        driver.get(url)
        time.sleep(random.uniform(2, 4))
        return driver.page_source
    finally:
        driver.quit()

# ── Strategy 3: requests + BS4 (fast, no JS) ──────────────────────────────────
def scrape_with_requests(url: str) -> str:
    headers = {
        'User-Agent': get_ua(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Referer': 'https://www.google.com/',
    }
    resp = requests.get(url, headers=headers, timeout=20, allow_redirects=True)
    resp.raise_for_status()
    return resp.text

# ── Parse HTML ─────────────────────────────────────────────────────────────────
def parse_product(html: str, url: str, marketplace: str) -> dict:
    soup = BeautifulSoup(html, 'lxml')

    def text(selector, attr=None, default=''):
        el = soup.select_one(selector)
        if not el: return default
        return (el.get(attr, '') if attr else el.get_text(strip=True)) or default

    def texts(selector, limit=5):
        return [el.get_text(strip=True) for el in soup.select(selector) if el.get_text(strip=True)][:limit]

    def imgs(selectors, limit=8):
        result = []
        for sel in selectors:
            for el in soup.select(sel):
                src = el.get('src') or el.get('data-src') or el.get('data-lazy-src') or ''
                if src and src.startswith('http') and 'icon' not in src.lower() and 'logo' not in src.lower():
                    if src not in result:
                        result.append(src)
                if len(result) >= limit:
                    break
        return result[:limit]

    # Marketplace-specific extraction
    if marketplace == 'amazon':
        title = text('#productTitle') or text('h1.a-size-large')
        price = text('.a-price .a-offscreen') or text('#price_inside_buybox')
        brand = text('#bylineInfo')
        bullets = texts('#feature-bullets li span:not(.aok-hidden)', 5)
        bullets = [b for b in bullets if len(b) > 10 and 'Make sure' not in b]
        description = text('#productDescription p') or text('meta[name="description"]', attr='content')
        images = imgs(['img[data-old-hires]', '[class*="imgTagWrapper"] img'])
        rating = text('#acrPopover', attr='title') or ''
        category = ' > '.join([el.get_text(strip=True) for el in soup.select('#wayfinding-breadcrumbs_feature_div a')])

    elif marketplace == 'ebay':
        title = text('h1.x-item-title__mainTitle span') or text('h1')
        price = text('[itemprop="price"]', attr='content') or text('.x-price-primary')
        brand = text('[class*="x-sellercard"]')
        bullets = []
        description = text('#desc_div') or text('meta[name="description"]', attr='content')
        images = imgs(['[class*="img-container"] img', '#icImg'])
        rating = ''
        category = ' > '.join([el.get_text(strip=True) for el in soup.select('[class*="breadcrumb"] a')])

    elif marketplace == 'aliexpress':
        title = text('h1[class*="title"]') or text('[class*="product-title"]') or text('h1')
        price = text('[class*="product-price"] [class*="price"]') or text('[itemprop="price"]', attr='content')
        brand = text('[class*="store-info"] a')
        bullets = []
        description = text('[id*="description"]') or text('meta[name="description"]', attr='content')
        images = imgs(['[class*="product-img"] img', '[class*="slider-img"] img'])
        rating = ''
        category = ''

    elif marketplace == 'etsy':
        title = text('h1[data-buy-box-listing-title]') or text('[class*="title"] h1') or text('h1')
        price = text('[class*="currency-value"]') or text('[data-selector="price-only"]')
        brand = text('[class*="shop-name"]') or text('[class*="seller"] a')
        bullets = []
        description = text('[class*="listing-description"]') or text('meta[name="description"]', attr='content')
        images = imgs(['[data-index] img', '[class*="carousel"] img'])
        rating = ''
        category = ' > '.join([el.get_text(strip=True) for el in soup.select('[class*="breadcrumb"] a')])

    elif marketplace == 'flipkart':
        title = text('span.B_NuCI') or text('h1[class*="_2NG7e"]') or text('h1')
        price = text('[class*="_30jeq3"]') or text('[class*="price"]')
        brand = text('[class*="G6XhRU"]') or text('a[class*="_2mBGV"]')
        bullets = texts('[class*="_1UhVsV"] li', 5)
        description = text('[class*="_1mXcCf"] p') or ''
        images = imgs(['[class*="_396cs4"] img', '[class*="q6DClP"] img'])
        rating = text('[class*="_3LWZlK"]') or ''
        category = ''

    elif marketplace == 'walmart':
        title = text('[itemprop="name"]') or text('h1.f3') or text('h1')
        price = text('[itemprop="price"]', attr='content') or text('[class*="price-characteristic"]')
        brand = text('[itemprop="brand"] [itemprop="name"]', attr='content') or ''
        bullets = texts('[class*="product-short-description"] li', 5)
        description = text('[itemprop="description"]') or text('meta[name="description"]', attr='content')
        images = imgs(['[class*="prod-hero-image"] img', '[class*="media-col"] img'])
        rating = ''
        category = ''

    else:  # generic
        title = text('h1') or text('[class*="product-title"]') or text('[itemprop="name"]') or text('title').split('|')[0].strip()
        price = text('[itemprop="price"]', attr='content') or text('[class*="price"]')
        brand = text('[itemprop="brand"]') or text('[class*="brand"]')
        bullets = texts('[class*="feature"] li, [class*="spec"] li, [class*="highlight"] li', 5)
        description = text('[itemprop="description"]') or text('[class*="description"]') or text('meta[name="description"]', attr='content')
        images = imgs(['img[src*="product"]', 'img[class*="product"]', 'img'])
        rating = ''
        category = ' > '.join([el.get_text(strip=True) for el in soup.select('[class*="breadcrumb"] a')])

    # Clean price
    price_clean = re.sub(r'[^\d.]', '', str(price)).split('.')[0] + ('.' + str(price).split('.')[-1] if '.' in str(price) else '')
    if price_clean.endswith('.'): price_clean = price_clean[:-1]

    keywords = text('meta[name="keywords"]', attr='content') or ''

    return {
        'title': (title or '').strip()[:500],
        'price': price_clean[:20],
        'brand': (brand or '').strip()[:255],
        'description': (description or '').strip()[:2000],
        'bullets': bullets[:5],
        'images': images[:8],
        'keywords': keywords[:500],
        'category': (category or '').strip()[:200],
        'rating': (rating or '').strip()[:50],
        'source_url': url,
        'detected_marketplace': marketplace,
    }

# ── Main scrape function with fallback chain ───────────────────────────────────
def scrape(url: str, proxy: str = None, use_playwright: bool = True) -> dict:
    marketplace = detect_marketplace(url)
    js_heavy = marketplace in ('amazon', 'aliexpress', 'alibaba', 'flipkart')
    html = None
    method_used = 'requests'

    if js_heavy or use_playwright:
        # Try Playwright first
        try:
            import asyncio
            html = asyncio.run(scrape_with_playwright(url, proxy))
            method_used = 'playwright'
            log.info(f'Playwright success: {url[:60]}')
        except Exception as e:
            log.warning(f'Playwright failed ({e}), trying Selenium...')
            try:
                html = scrape_with_selenium(url)
                method_used = 'selenium'
                log.info(f'Selenium success: {url[:60]}')
            except Exception as e2:
                log.warning(f'Selenium failed ({e2}), using requests...')

    if not html:
        html = scrape_with_requests(url)
        method_used = 'requests'
        log.info(f'Requests success: {url[:60]}')

    result = parse_product(html, url, marketplace)
    result['scrape_method'] = method_used
    return result

# ── Routes ─────────────────────────────────────────────────────────────────────
@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'service': 'python-scraper', 'version': '1.0'})

@app.route('/scrape', methods=['POST'])
def scrape_endpoint():
    data = request.get_json()
    url = data.get('url', '').strip()
    proxy = data.get('proxy')
    use_playwright = data.get('playwright', True)

    if not url:
        return jsonify({'error': 'url required'}), 400

    try:
        result = scrape(url, proxy, use_playwright)
        return jsonify(result)
    except Exception as e:
        log.error(f'Scrape error for {url}: {e}')
        return jsonify({'error': str(e), 'url': url}), 500

@app.route('/scrape/batch', methods=['POST'])
def batch_scrape():
    data = request.get_json()
    urls = data.get('urls', [])
    proxy = data.get('proxy')
    delay = float(data.get('delay', 1.2))
    use_playwright = data.get('playwright', True)

    if not urls:
        return jsonify({'error': 'urls required'}), 400

    results = []
    for i, url in enumerate(urls[:50]):  # max 50 per batch
        url = url.strip()
        if not url:
            continue
        if i > 0:
            time.sleep(delay + random.uniform(0, 0.5))
        try:
            result = scrape(url, proxy, use_playwright)
            results.append({'url': url, 'status': 'success', 'data': result})
        except Exception as e:
            results.append({'url': url, 'status': 'error', 'error': str(e)})

    return jsonify({
        'results': results,
        'total': len(results),
        'succeeded': sum(1 for r in results if r['status'] == 'success'),
    })

@app.route('/detect', methods=['GET'])
def detect():
    url = request.args.get('url', '')
    return jsonify({'marketplace': detect_marketplace(url)})

@app.route('/keywords', methods=['POST'])
def keywords():
    """Extract keywords from product URLs using BS4"""
    data = request.get_json()
    urls = data.get('urls', [])
    product_name = data.get('productName', '')

    all_words = {}

    def add_word(w, weight=1):
        w = re.sub(r'[^a-z0-9\s\-]', '', w.lower()).strip()
        if len(w) < 3: return
        stopwords = {'the','and','for','with','this','that','from','your','are','has','have','not','can','will'}
        if w in stopwords: return
        all_words[w] = all_words.get(w, 0) + weight

    for url in urls[:5]:
        try:
            html = scrape_with_requests(url.strip())
            soup = BeautifulSoup(html, 'lxml')
            for el in soup.select('h1, h2'):
                [add_word(w, 3) for w in el.get_text().split()]
            meta_kw = soup.select_one('meta[name="keywords"]')
            if meta_kw:
                [add_word(w.strip(), 4) for w in (meta_kw.get('content') or '').split(',')]
            for el in soup.select('[class*="feature"],[class*="bullet"],[class*="description"]'):
                [add_word(w, 2) for w in el.get_text().split()[:50]]
            [add_word(w, 1) for w in ' '.join(soup.stripped_strings).split()[:400]]
        except Exception as e:
            log.warning(f'Keyword scrape failed for {url}: {e}')

    if product_name:
        [add_word(w, 5) for w in product_name.split()]

    sorted_words = sorted(all_words.items(), key=lambda x: x[1], reverse=True)
    keywords_list = [{'word': w, 'count': c} for w, c in sorted_words[:80]]

    return jsonify({
        'keywords': keywords_list,
        'primary': [k['word'] for k in keywords_list[:8]],
        'secondary': [k['word'] for k in keywords_list[8:25]],
        'longtail': [k['word'] for k in keywords_list[25:60]],
        'total': len(keywords_list),
    })

if __name__ == '__main__':
    port = int(os.environ.get('PYTHON_SCRAPER_PORT', 5001))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    log.info(f'Python Scraper starting on port {port}')
    app.run(host='0.0.0.0', port=port, debug=debug, threaded=True)
