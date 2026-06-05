import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ListingAI — Ecommerce Listing Automation',
  description: 'Generate, manage and export 500+ ecommerce product listings in minutes using AI. Supports Shopify, Amazon, WooCommerce.',
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-sm">LA</div>
          <span className="font-bold text-lg">ListingAI</span>
          <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">v4</span>
        </div>
        <div className="flex gap-3">
          <Link href="/sign-in" className="text-sm text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">Sign In</Link>
          <Link href="/sign-up" className="text-sm bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors font-semibold">Get Started Free</Link>
          <Link href="/dashboard" className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold">Dashboard →</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-sm px-4 py-2 rounded-full mb-8">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          Production-grade ecommerce automation
        </div>
        <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent leading-tight">
          500+ Listings<br />in 20 Minutes
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          AI-powered product listing automation for ecommerce managers. Scrape any marketplace, generate optimised content with Claude/Llama/Gemini, export to Shopify, Amazon, WooCommerce.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/dashboard" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 shadow-lg shadow-indigo-500/25">
            Open Dashboard →
          </Link>
          <Link href="#features" className="border border-gray-700 hover:border-gray-500 text-gray-300 font-semibold px-8 py-4 rounded-xl text-lg transition-colors">
            See Features
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-800 py-12">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            ['∞', 'Categories & Products'],
            ['FREE', 'Groq & Gemini AI'],
            ['8', 'Marketplaces Scraped'],
            ['3', 'Export Platforms'],
          ].map(([v, l]) => (
            <div key={l}><div className="text-3xl font-black text-indigo-400">{v}</div><div className="text-sm text-gray-500 mt-1">{l}</div></div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-black text-center mb-4">Everything you need</h2>
        <p className="text-gray-400 text-center mb-16">Built for ecommerce managers handling 100–10,000+ listings</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            ['🤖', 'Free AI Generation', 'Groq (Llama 3.3 70B), Gemini Flash, Ollama local, AWS Bedrock — all in one. Switch providers per listing.'],
            ['🔍', 'Universal Scraper', 'Real Playwright headless browser. Amazon, eBay, AliExpress, Etsy, Flipkart, Walmart — handles JS-heavy sites.'],
            ['⚡', 'Bulk Queue 500+', 'Add 500 product names, set AI config, start — all generated in the background. Live Socket.io progress.'],
            ['🗄️', 'MySQL Database', 'Infinite products, infinite categories. Search, filter, pipeline status (Draft→Review→Approved→Exported).'],
            ['📤', '3-Platform Export', 'Shopify, Amazon Flat File, WooCommerce — download all 3 as ZIP. Export directly from DB.'],
            ['🔒', 'Auth + Multi-user', 'Clerk authentication. Each user has their own products, categories, queue and settings.'],
            ['📊', 'Analytics Dashboard', 'Price distribution, SEO score charts, keyword frequency, product type breakdown.'],
            ['☁️', 'AWS Bedrock', 'Claude 3.5 Sonnet, Llama 3.3 70B, Nova, Mistral, Titan, Cohere — 44 models, 31 regions.'],
            ['🐳', 'Docker Ready', 'docker-compose.yml with MySQL, Redis, Kafka, Zookeeper, Nginx, app. One command to production.'],
          ].map(([icon, title, desc]) => (
            <div key={title as string} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-indigo-500/50 transition-colors">
              <div className="text-3xl mb-4">{icon}</div>
              <h3 className="font-bold text-lg mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Infinite Categories */}
      <section className="bg-gray-900 border-y border-gray-800 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-black mb-3">∞ Infinite Categories</h2>
          <p className="text-gray-400 mb-8">Create unlimited custom categories with icons, colors, and AI prompt hints. Every category gets tailored AI copy.</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {['📦 General','💻 Electronics','👕 Clothing','💄 Beauty','🏠 Home & Living','🏃 Sports','🍎 Food','🧸 Toys','🔨 Tools','🚗 Automotive','📚 Books','💊 Health','💍 Jewelry','🐾 Pet Supplies','🖥️ Office','🎮 Gaming','📷 Photography','🎵 Music','✈️ Travel','🌱 Garden','+ Custom…'].map(c => (
              <span key={c} className="bg-gray-800 border border-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-lg">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-xl font-bold mb-8 text-gray-300">Production Tech Stack</h3>
          <div className="flex flex-wrap gap-3 justify-center">
            {['Next.js 16', 'TypeScript', 'Tailwind CSS v4', 'Prisma ORM', 'MySQL 8', 'Redis 7', 'Kafka', 'Socket.io', 'Playwright', 'Clerk Auth', 'Docker', 'Nginx'].map(t => (
              <span key={t} className="bg-gray-800 text-gray-300 text-sm px-3 py-1.5 rounded-lg border border-gray-700">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center border-t border-gray-800">
        <h2 className="text-3xl font-black mb-4">Ready to save hours every day?</h2>
        <p className="text-gray-400 mb-8">Get a free Groq key at console.groq.com — ready in 2 minutes.</p>
        <Link href="/dashboard" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all hover:scale-105 inline-block">
          Open Dashboard →
        </Link>
      </section>

      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        <p>ListingAI v4 — Built for ecommerce professionals · Next.js 16 + MySQL + Kafka + Socket.io + Docker</p>
      </footer>
    </main>
  )
}
