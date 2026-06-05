'use client'

import { useEffect, useState } from 'react'

type Category = { id: number; name: string; icon: string; color: string; _count?: { products: number } }

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', icon: '📦', color: '#6366f1' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error(`${res.status}`)
      const json = await res.json()
      setCats(json.categories ?? json)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!newCat.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCat),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      setNewCat({ name: '', icon: '📦', color: '#6366f1' })
      setShowAdd(false)
      load()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      load()
    } catch {
      alert('Failed to delete')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Categories</h1>
          <p className="text-gray-400 text-sm mt-1">
            {loading ? 'Loading…' : `${cats.length} categor${cats.length !== 1 ? 'ies' : 'y'}`}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + New Category
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-xl p-4 mb-5 text-sm">
          ⚠️ {error} — <button onClick={load} className="underline">Retry</button>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="bg-gray-900 border border-indigo-500/40 rounded-xl p-5 mb-6 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Icon</label>
            <input
              type="text"
              value={newCat.icon}
              onChange={e => setNewCat(v => ({ ...v, icon: e.target.value }))}
              className="w-16 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white text-center focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Name *</label>
            <input
              type="text"
              value={newCat.name}
              onChange={e => setNewCat(v => ({ ...v, name: e.target.value }))}
              placeholder="Category name"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Color</label>
            <input
              type="color"
              value={newCat.color}
              onChange={e => setNewCat(v => ({ ...v, color: e.target.value }))}
              className="w-12 h-9 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !newCat.name.trim()}
            className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Add'}
          </button>
          <button
            onClick={() => setShowAdd(false)}
            className="border border-gray-700 text-gray-400 hover:text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-900 rounded-xl animate-pulse border border-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {cats.map(c => (
            <div
              key={c.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-indigo-500/50 transition-colors group relative"
              style={{ borderLeft: `3px solid ${c.color}` }}
            >
              <div className="text-3xl mb-2">{c.icon}</div>
              <div className="font-semibold text-white text-sm">{c.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {c._count?.products ?? 0} products
              </div>
              <button
                onClick={() => handleDelete(c.id)}
                className="absolute top-2 right-2 text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs"
                title="Delete"
              >
                🗑️
              </button>
            </div>
          ))}
          <button
            onClick={() => setShowAdd(true)}
            className="bg-gray-900 border-2 border-dashed border-gray-700 rounded-xl p-4 hover:border-indigo-500/50 transition-colors flex flex-col items-center justify-center text-center min-h-[100px]"
          >
            <div className="text-3xl mb-2">+</div>
            <div className="text-sm text-gray-400">Add Custom Category</div>
          </button>
        </div>
      )}
    </div>
  )
}
