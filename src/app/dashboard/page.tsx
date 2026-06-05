'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Stats = { total: number; byStatus: { status: string; _count: number }[] }

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/products/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d) })
      .catch(() => {})
  }, [])

  const byStatus = stats?.byStatus ?? []
  const pending = byStatus.find(s => s.status === 'pending')?._count ?? 0
  const exported = byStatus.find(s => s.status === 'exported')?._count ?? 0
  const generated = byStatus.find(s => s.status === 'generated')?._count ?? 0

  const statCards = [
    { label: 'Total Products', value: stats ? stats.total : '—', icon: '🗄️' },
    { label: 'Generated Today', value: stats ? generated : '—', icon: '✍️' },
    { label: 'Queue Pending', value: stats ? pending : '—', icon: '⚡' },
    { label: 'Exported', value: stats ? exported : '—', icon: '📤' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Your ecommerce listing overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-3xl font-black text-white">{s.value}</div>
            <div className="text-sm text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { href: '/dashboard/queue', icon: '⚡', title: 'Bulk Generate', desc: 'Add products to queue and AI-generate all content automatically', color: 'from-yellow-500/10 to-orange-500/10 border-yellow-500/30' },
          { href: '/dashboard/scraper', icon: '🔍', title: 'Scrape Products', desc: 'Scrape any marketplace: Amazon, eBay, AliExpress, Etsy, Walmart', color: 'from-blue-500/10 to-cyan-500/10 border-blue-500/30' },
          { href: '/dashboard/content', icon: '✍️', title: 'AI Content', desc: 'Generate titles, descriptions, bullets with Groq/Gemini/Bedrock', color: 'from-indigo-500/10 to-purple-500/10 border-indigo-500/30' },
        ].map(a => (
          <Link key={a.href} href={a.href} className={`bg-gradient-to-br ${a.color} border rounded-xl p-5 hover:scale-[1.02] transition-all block`}>
            <div className="text-3xl mb-3">{a.icon}</div>
            <h3 className="font-bold text-white mb-1">{a.title}</h3>
            <p className="text-sm text-gray-400">{a.desc}</p>
          </Link>
        ))}
      </div>

      {/* Getting Started */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">🚀 Getting Started</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Set your AI key', desc: 'Go to Settings → get a free Groq key from console.groq.com in 30 seconds.' },
            { step: '2', title: 'Queue your products', desc: 'Paste 500 product names in ⚡ Queue → click Start → AI generates all automatically.' },
            { step: '3', title: 'Export', desc: 'Go to 🗄️ Products → select Approved → Export as Shopify, Amazon, or WooCommerce CSV.' },
          ].map(s => (
            <div key={s.step} className="flex gap-3">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{s.step}</div>
              <div>
                <div className="font-semibold text-white text-sm">{s.title}</div>
                <div className="text-gray-400 text-xs mt-0.5 leading-relaxed">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
