'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'

type Post = {
  id: number
  slug: string
  title: string
  excerpt: string
  readTime: number
  authorName: string
  category?: { name: string; icon: string } | null
}
type ApiResponse = { posts: Post[]; total: number; page: number; pages: number }

const CATS = ['All', 'Amazon', 'Shopify', 'AI Tools', 'SEO', 'Product Listings', 'Strategy']

export default function BlogPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [cat, setCat] = useState('All')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [q])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '9' })
      if (debouncedQ) params.set('q', debouncedQ)
      if (cat !== 'All') params.set('category', cat.toLowerCase().replace(/\s+/g, '-'))
      const res = await fetch(`/api/blog/posts?${params}`)
      if (res.ok) setData(await res.json())
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [page, debouncedQ, cat])

  useEffect(() => { load() }, [load])

  const posts = data?.posts ?? []
  const pages = data?.pages ?? 1

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xs">LA</div>
          <span className="font-bold">ListingAI</span>
        </Link>
        <div className="flex gap-4 text-sm text-gray-400">
          <Link href="/blog" className="text-white font-semibold">Blog</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
          <Link href="/dashboard" className="bg-indigo-500 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition-colors">Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black mb-4">ListingAI Blog</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">Expert guides on ecommerce optimization, AI content generation, and selling strategies.</p>
          <div className="flex gap-2 justify-center mt-6 flex-wrap">
            {CATS.map(c => (
              <button
                key={c}
                onClick={() => { setCat(c); setPage(1) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  cat === c ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-10">
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search articles…"
            className="w-full max-w-md mx-auto block bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none placeholder-gray-500"
          />
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[300px]">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-800" />
                <div className="p-5 space-y-2">
                  <div className="h-3 bg-gray-800 rounded w-1/3" />
                  <div className="h-5 bg-gray-800 rounded" />
                  <div className="h-5 bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-gray-500">
              <div className="text-4xl mb-4">📝</div>
              <p>No posts yet. Check back soon!</p>
            </div>
          ) : (
            posts.map(p => (
              <article key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-colors flex flex-col">
                <div className="h-48 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-5xl">
                  {p.category?.icon ?? '📝'}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    {p.category && (
                      <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                        {p.category.name}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{p.readTime} min read</span>
                  </div>
                  <Link href={`/blog/${p.slug}`} className="font-bold text-white text-base mb-2 line-clamp-2 hover:text-indigo-400">
                    {p.title}
                  </Link>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-1">{p.excerpt}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs text-gray-500">{p.authorName}</span>
                    <Link href={`/blog/${p.slug}`} className="text-xs text-indigo-400 hover:underline">Read →</Link>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  n === page ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <section className="bg-indigo-500/10 border-y border-indigo-500/20 py-16 text-center">
        <h2 className="text-3xl font-black mb-4">Ready to automate your listings?</h2>
        <p className="text-gray-400 mb-8">Generate 500+ product listings in 20 minutes with free AI.</p>
        <Link href="/dashboard" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-8 py-4 rounded-xl transition-colors inline-block">
          Start Free →
        </Link>
      </section>

      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/" className="hover:text-gray-300">Home</Link>
          <Link href="/terms" className="hover:text-gray-300">Terms</Link>
          <Link href="/privacy" className="hover:text-gray-300">Privacy</Link>
          <Link href="/contact" className="hover:text-gray-300">Contact</Link>
        </div>
      </footer>
    </div>
  )
}
