'use client'

import { useEffect, useState } from 'react'

type Stats = { total: number; byStatus: { status: string; _count: number }[] }

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/products/stats')
      if (!res.ok) throw new Error(`${res.status}`)
      setStats(await res.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const byStatus = stats?.byStatus ?? []
  const approved = byStatus.find(s => s.status === 'approved')?._count ?? 0
  const total = stats?.total ?? 0

  const statCards = [
    { label: 'Total Products', value: loading ? '…' : total, icon: '🗄️' },
    { label: 'Approved', value: loading ? '…' : approved, icon: '✅' },
    { label: 'Completion', value: loading || !total ? '—' : `${Math.round((approved / total) * 100)}%`, icon: '📊' },
    { label: 'Pending Review', value: loading ? '…' : (byStatus.find(s => s.status === 'generated')?._count ?? 0), icon: '⏳' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">Product listing performance and data insights</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          📊 Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-xl p-4 mb-6 text-sm">
          ⚠️ {error} — <button onClick={load} className="underline">Retry</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-3xl font-black text-white">
              {loading ? <span className="animate-pulse text-gray-600">—</span> : s.value}
            </div>
            <div className="text-sm text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="font-bold text-white mb-4">📦 Status Breakdown</h3>
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-gray-800 rounded animate-pulse" />)}
            </div>
          ) : byStatus.length === 0 ? (
            <div className="text-center py-8 text-gray-600 text-sm">Generate products first to see analytics</div>
          ) : (
            <div className="space-y-2">
              {byStatus.map(s => (
                <div key={s.status} className="flex items-center gap-3">
                  <span className="capitalize text-gray-300 text-sm w-24">{s.status}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-3">
                    <div
                      className="bg-indigo-500 h-3 rounded-full"
                      style={{ width: total ? `${(s._count / total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-gray-400 text-sm w-8 text-right">{s._count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {[
          ['💰 Price Distribution', 'Price range breakdown of your listings'],
          ['🔑 Top Keywords', 'Most used keywords across all tags'],
          ['📦 Product Types', 'Distribution of product categories'],
        ].map(([t, d]) => (
          <div key={t} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="font-bold text-white mb-1">{t}</h3>
            <p className="text-gray-500 text-xs mb-4">{d}</p>
            <div className="text-center py-8 text-gray-600 text-sm">Generate products first to see analytics</div>
          </div>
        ))}
      </div>
    </div>
  )
}
