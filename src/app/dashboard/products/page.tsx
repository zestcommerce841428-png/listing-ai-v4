'use client'

import { useEffect, useState, useCallback } from 'react'

type Category = { id: number; name: string; icon: string; color: string }
type Product = {
  id: number
  title: string
  sku: string | null
  status: string
  price: number | null
  vendor: string | null
  tags: string | null
  category: Category | null
  updatedAt: string
}
type ApiResponse = { rows: Product[]; total: number; page: number; pages: number }

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-700 text-gray-300',
  pending: 'bg-yellow-500/20 text-yellow-400',
  generating: 'bg-blue-500/20 text-blue-400',
  generated: 'bg-indigo-500/20 text-indigo-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  exported: 'bg-purple-500/20 text-purple-400',
}

const STATUSES = ['all', 'draft', 'pending', 'generating', 'generated', 'approved', 'rejected', 'exported']

export default function ProductsPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [q])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (debouncedQ) params.set('q', debouncedQ)
      if (status !== 'all') params.set('status', status)
      const res = await fetch(`/api/products?${params}`)
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const json: ApiResponse = await res.json()
      setData(json)
      setSelected(new Set())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedQ, status])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      fetchProducts()
    } catch {
      alert('Failed to delete product')
    } finally {
      setDeletingId(null)
    }
  }

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchProducts()
    } catch {
      alert('Failed to update status')
    }
  }

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (!data) return
    if (selected.size === data.rows.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(data.rows.map(r => r.id)))
    }
  }

  const bulkDelete = async () => {
    if (!selected.size || !confirm(`Delete ${selected.size} product(s)?`)) return
    await Promise.all([...selected].map(id => fetch(`/api/products/${id}`, { method: 'DELETE' })))
    fetchProducts()
  }

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const pages = data?.pages ?? 1

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Products</h1>
          <p className="text-gray-400 text-sm mt-1">
            {loading ? 'Loading…' : `${total.toLocaleString()} product${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button
              onClick={bulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              🗑️ Delete {selected.size}
            </button>
          )}
          <a
            href="/dashboard/queue"
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + Add via Queue
          </a>
        </div>
      </div>

      {/* Search + Status tabs */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search title, SKU, vendor, tags…"
            className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1) }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors capitalize ${
                status === s
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-xl p-4 mb-5 flex items-center gap-2">
          ⚠️ {error}
          <button onClick={fetchProducts} className="ml-auto text-sm underline">Retry</button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-900 rounded-lg animate-pulse border border-gray-800" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && rows.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
          <div className="text-5xl mb-4">🗄️</div>
          <h3 className="text-xl font-bold text-white mb-2">No products found</h3>
          <p className="text-gray-400 mb-6">
            {debouncedQ || status !== 'all'
              ? 'No products match your filters.'
              : 'Products appear here after generating via Queue or Content AI.'}
          </p>
          {debouncedQ || status !== 'all' ? (
            <button
              onClick={() => { setQ(''); setStatus('all') }}
              className="border border-gray-700 hover:border-gray-500 text-gray-300 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Clear filters
            </button>
          ) : (
            <div className="flex gap-3 justify-center">
              <a href="/dashboard/queue" className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">⚡ Go to Queue</a>
              <a href="/dashboard/content" className="border border-gray-700 hover:border-gray-500 text-gray-300 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">✍️ Content AI</a>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      {!loading && rows.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left w-8">
                    <input
                      type="checkbox"
                      checked={selected.size === rows.length && rows.length > 0}
                      onChange={toggleSelectAll}
                      className="accent-indigo-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-left">Vendor</th>
                  <th className="px-4 py-3 text-left">Updated</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {rows.map(product => (
                  <tr key={product.id} className="hover:bg-gray-800/50 transition-colors group">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="accent-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <span className="text-white font-medium line-clamp-2 leading-tight">
                        {product.title || <span className="text-gray-500 italic">Untitled</span>}
                      </span>
                      {product.tags && (
                        <div className="text-gray-500 text-xs mt-0.5 truncate">{product.tags}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                      {product.sku || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {product.category ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                          {product.category.icon} {product.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={product.status}
                        onChange={e => handleStatusChange(product.id, e.target.value)}
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none ${STATUS_COLORS[product.status] ?? 'bg-gray-700 text-gray-300'}`}
                        style={{ background: 'transparent' }}
                      >
                        {Object.keys(STATUS_COLORS).map(s => (
                          <option key={s} value={s} className="bg-gray-900 text-white">{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300 font-mono">
                      {product.price != null ? `$${Number(product.price).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-[100px]">
                      {product.vendor || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(product.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
                        className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-base"
                        title="Delete"
                      >
                        {deletingId === product.id ? '⏳' : '🗑️'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
              <span className="text-gray-400 text-xs">
                Page {page} of {pages} · {total} total
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-xs rounded bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                {[...Array(Math.min(pages, 7))].map((_, i) => {
                  const p = i + 1
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        page === p ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="px-3 py-1 text-xs rounded bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
