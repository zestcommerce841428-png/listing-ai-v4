'use client'

import type { Metadata } from 'next'
import Link from 'next/link'
import { useEffect, useState } from 'react'

// metadata can't be exported from a client component — moved to a separate layout or removed
// export const metadata: Metadata = { title: 'Admin Dashboard', robots: { index: false } }

type Stats = { users: number; products: number; blog: number; messages: number }
type Message = { id: number; name: string; email: string; subject: string; status: string; createdAt: string }

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({ users: 0, products: 0, blog: 0, messages: 0 })
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [usersRes, contactRes, blogRes, prodRes] = await Promise.allSettled([
          fetch('/api/admin/users?limit=1'),
          fetch('/api/contact?status=unread&limit=5'),
          fetch('/api/blog/posts?limit=1&status=published'),
          fetch('/api/products?limit=1'),
        ])

        const parse = async (r: PromiseSettledResult<Response>) => {
          if (r.status === 'fulfilled' && r.value.ok) {
            try { return await r.value.json() } catch { return null }
          }
          return null
        }

        const [u, c, b, p] = await Promise.all([
          parse(usersRes), parse(contactRes), parse(blogRes), parse(prodRes),
        ])

        setStats({
          users: u?.total ?? 0,
          products: p?.total ?? 0,
          blog: b?.total ?? 0,
          messages: c?.statusCounts?.unread ?? 0,
        })
        setMessages(c?.messages ?? [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const statCards = [
    { label: '👥 Users', value: stats.users, sub: 'Total registered' },
    { label: '📦 Products', value: stats.products, sub: 'Total in DB' },
    { label: '📝 Blog Posts', value: stats.blog, sub: 'Published' },
    { label: '💬 Messages', value: stats.messages, sub: 'Unread' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-red-500 rounded-lg flex items-center justify-center font-bold text-xs">SA</div>
            <span className="font-bold">Super Admin</span>
          </Link>
          <span className="text-gray-600">|</span>
          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">ADMIN PANEL</span>
        </div>
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">← App Dashboard</Link>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">Super Admin Panel</h1>
          <p className="text-gray-400 mt-1">Manage everything from one place</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="text-lg font-bold text-white">{s.label}</div>
              <div className="text-3xl font-black text-indigo-400 my-1">
                {loading ? <span className="animate-pulse text-gray-600">—</span> : s.value}
              </div>
              <div className="text-xs text-gray-500">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Admin Nav */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { href: '/admin/users', icon: '👥', title: 'User Management', desc: 'View, ban, update plans' },
            { href: '/admin/contact', icon: '💬', title: 'Contact Messages', desc: 'Read & reply to messages' },
            { href: '/admin/blog', icon: '📝', title: 'Blog Manager', desc: 'Create, edit, delete posts' },
            { href: '/admin/settings', icon: '⚙️', title: 'Site Settings', desc: 'All platform settings' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-indigo-500/50 transition-colors block"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <div className="font-bold text-white text-sm mb-1">{item.title}</div>
              <div className="text-xs text-gray-500">{item.desc}</div>
            </Link>
          ))}
        </div>

        {/* Recent Messages */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">Recent Contact Messages</h2>
            <Link href="/admin/contact" className="text-sm text-indigo-400 hover:underline">View All →</Link>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500 text-sm animate-pulse">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No unread messages.</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {messages.map(m => (
                <div key={m.id} className="flex items-start gap-3 py-3">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 font-bold text-sm flex-shrink-0">
                    {m.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-white">{m.name}</span>
                      <span className="text-xs text-gray-500">{m.email}</span>
                      <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                        {m.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mt-0.5 truncate">{m.subject}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(m.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
