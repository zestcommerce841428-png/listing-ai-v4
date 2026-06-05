'use client'

import { useState } from 'react'

const TOOLS = [
  { id:'bulk-rewrite',       cat:'🤖 AI',         name:'Bulk AI Rewrite',        desc:'AI rewrites titles/descriptions/keywords in batch for all selected products',      badge:'AI' },
  { id:'auto-classify',      cat:'🤖 AI',         name:'Auto-Classify',          desc:'AI automatically assigns the best category to each of your products',              badge:'AI' },
  { id:'bullet-optimizer',   cat:'🤖 AI',         name:'Bullet Optimizer',       desc:'AI reorders and rewrites bullet points for maximum impact per platform',           badge:'AI' },
  { id:'bundle-suggest',     cat:'🤖 AI',         name:'Bundle Suggester',       desc:'AI suggests profitable product bundle combinations with pricing and hooks',         badge:'AI' },
  { id:'review-analyzer',    cat:'🤖 AI',         name:'Review Analyzer',        desc:'Analyze customer reviews to discover what to improve in your listings',            badge:'AI' },
  { id:'keyword-planner',    cat:'🤖 AI',         name:'Keyword Planner',        desc:'AI plans a full keyword strategy per category with primary, secondary, longtail',  badge:'AI' },
  { id:'seo-analyze',        cat:'📊 SEO',        name:'SEO Analyzer',           desc:'Per-product SEO scoring with A-D grade, specific issues and actionable tips',      badge:'SEO' },
  { id:'keyword-density',    cat:'📊 SEO',        name:'Keyword Density',        desc:'Analyze keyword frequency in product content — find over/under-optimized content', badge:'SEO' },
  { id:'tag-extractor',      cat:'📊 SEO',        name:'Tag Extractor',          desc:'Automatically extract the most relevant tags from product descriptions',           badge:'SEO' },
  { id:'schema-generator',   cat:'📊 SEO',        name:'Schema Generator',       desc:'Generate JSON-LD Product schema markup for rich results in Google Search',        badge:'SEO' },
  { id:'margin-calc',        cat:'💰 Pricing',    name:'Margin Calculator',      desc:'Calculate profit margin, ROI, and total cost per product in bulk',                 badge:'Pricing' },
  { id:'price-intel',        cat:'💰 Pricing',    name:'Price Intelligence',     desc:'Price distribution analysis and strategy recommendations per category',            badge:'Pricing' },
  { id:'find-replace',       cat:'⚙️ Operations', name:'Find & Replace',         desc:'Bulk find and replace text across all DB products — fix brand names, typos, URLs', badge:'Ops' },
  { id:'clone-product',      cat:'⚙️ Operations', name:'Clone Product',          desc:'Clone any product as a starting point for variations or similar items',            badge:'Ops' },
  { id:'merge-products',     cat:'⚙️ Operations', name:'Merge Products',         desc:'Merge duplicate products keeping the best fields from each',                       badge:'Ops' },
  { id:'bulk-pipeline',      cat:'⚙️ Operations', name:'Bulk Pipeline',          desc:'Move hundreds of products through the pipeline (Draft → Review → Approved)',       badge:'Ops' },
  { id:'inventory-alerts',   cat:'⚙️ Operations', name:'Inventory Alerts',       desc:'Flag products with low or zero quantity — set your own threshold',                 badge:'Ops' },
  { id:'health-score',       cat:'📊 Analytics',  name:'Health Score Dashboard', desc:'Overall listing health score across your entire catalogue with A-D breakdown',     badge:'Analytics' },
  { id:'compare-listings',   cat:'📊 Analytics',  name:'Compare Listings',       desc:'Side-by-side comparison of any 2-5 products with SEO score winner',                badge:'Analytics' },
  { id:'export-history',     cat:'📊 Analytics',  name:'Export History',         desc:'Full export history with platform, row count, filename and timestamp',             badge:'Analytics' },
  { id:'description-builder',cat:'✍️ Content',    name:'Description Builder',    desc:'Build structured, professional HTML product descriptions from a feature list',     badge:'Content' },
  { id:'listing-preview',    cat:'✍️ Content',    name:'Listing Preview',        desc:'HTML preview of how your listing looks on Shopify or Amazon before publishing',    badge:'Content' },
  { id:'style-presets',      cat:'✍️ Content',    name:'Style Presets',          desc:'Save and reuse custom AI writing style presets across all your listings',          badge:'Content' },
  { id:'import-url',         cat:'🔍 Import',     name:'Import from URL',        desc:'Scrape any product URL and import directly to your database (Playwright-powered)', badge:'Import' },
]

const BADGE_COLORS: Record<string, string> = {
  'AI':        'bg-purple-500/20 text-purple-400',
  'SEO':       'bg-blue-500/20 text-blue-400',
  'Pricing':   'bg-green-500/20 text-green-400',
  'Ops':       'bg-yellow-500/20 text-yellow-400',
  'Analytics': 'bg-cyan-500/20 text-cyan-400',
  'Content':   'bg-indigo-500/20 text-indigo-400',
  'Import':    'bg-orange-500/20 text-orange-400',
}

const CATEGORIES = ['All', '🤖 AI', '📊 SEO', '💰 Pricing', '⚙️ Operations', '📊 Analytics', '✍️ Content', '🔍 Import']

export default function ToolsPage() {
  const [activeCat, setActiveCat] = useState('All')
  const [running, setRunning] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, string>>({})

  const filtered = activeCat === 'All' ? TOOLS : TOOLS.filter(t => t.cat === activeCat)

  const openTool = async (id: string) => {
    setRunning(id)
    try {
      const res = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: id }),
      })
      const d = await res.json()
      setResults(r => ({ ...r, [id]: d.message ?? d.error ?? JSON.stringify(d) }))
    } catch (e: unknown) {
      setResults(r => ({ ...r, [id]: e instanceof Error ? e.message : 'Error' }))
    } finally {
      setRunning(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Tools</h1>
          <p className="text-gray-400 text-sm mt-1">24+ professional listing management tools — all powered by real APIs</p>
        </div>
        <a href="/api/tools" target="_blank" className="border border-gray-700 text-gray-400 text-sm px-4 py-2 rounded-lg hover:text-white hover:border-gray-500 transition-colors">
          📖 API Reference
        </a>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeCat === cat ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(tool => (
          <div key={tool.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/5 group flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${BADGE_COLORS[tool.badge] ?? 'bg-gray-700 text-gray-400'}`}>
                {tool.badge}
              </span>
              <span className="text-xs text-gray-600 font-mono">{tool.id}</span>
            </div>
            <h3 className="font-bold text-white text-sm mb-2 group-hover:text-indigo-300 transition-colors">{tool.name}</h3>
            <p className="text-gray-500 text-xs leading-relaxed mb-4 flex-1">{tool.desc}</p>
            {results[tool.id] && (
              <div className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg p-2 mb-2 truncate">
                {results[tool.id]}
              </div>
            )}
            <button
              onClick={() => openTool(tool.id)}
              disabled={running === tool.id}
              className="w-full bg-gray-800 hover:bg-indigo-500 border border-gray-700 hover:border-indigo-500 text-gray-400 hover:text-white text-xs font-semibold py-2 rounded-lg transition-all disabled:opacity-50"
            >
              {running === tool.id ? '⏳ Running…' : 'Open Tool'}
            </button>
          </div>
        ))}
      </div>

      {/* API Usage */}
      <div className="mt-12 bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-white mb-2">📡 API Access — All Tools via Single Endpoint</h2>
        <p className="text-gray-400 text-sm mb-4">All 24 tools are accessible via a single POST endpoint:</p>
        <pre className="bg-gray-950 rounded-lg p-4 text-xs font-mono text-green-400 overflow-x-auto">{`POST /api/tools
{
  "tool": "seo-analyze",        // Tool ID
  "productIds": [1, 2, 3],      // Tool-specific parameters
  ...params
}`}</pre>
        <div className="mt-4 grid md:grid-cols-3 gap-4 text-xs">
          {[
            ['Rate Limited', '100 calls/min per user'],
            ['Auth Required', 'Clerk session required'],
            ['Response Format', '{ success, tool, result }'],
          ].map(([l, v]) => (
            <div key={l} className="bg-gray-800 rounded-lg p-3">
              <div className="text-gray-400 mb-1">{l}</div>
              <div className="font-semibold text-white">{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[['24','Total Tools'],['6','AI-Powered'],['4','SEO Tools'],['5','Operations']].map(([v, l]) => (
          <div key={l} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-indigo-400">{v}</div>
            <div className="text-xs text-gray-400 mt-1">{l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
