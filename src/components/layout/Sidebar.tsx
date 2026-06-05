'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/dashboard/products', icon: '🗄️', label: 'Products' },
  { href: '/dashboard/queue', icon: '⚡', label: 'Queue' },
  { href: '/dashboard/scraper', icon: '🔍', label: 'Scraper' },
  { href: '/dashboard/content', icon: '✍️', label: 'Content AI' },
  { href: '/dashboard/export', icon: '📤', label: 'CSV Export' },
  { href: '/dashboard/images', icon: '🖼️', label: 'Images' },
  { href: '/dashboard/categories', icon: '📂', label: 'Categories' },
  { href: '/dashboard/tools', icon: '🛠️', label: 'Tools (24+)' },
  { href: '/dashboard/analytics', icon: '📊', label: 'Analytics' },
  { href: '/dashboard/settings', icon: '⚙️', label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-sm">LA</div>
          <div>
            <div className="font-bold text-white text-sm leading-none">ListingAI</div>
            <div className="text-indigo-400 text-xs mt-0.5">v4 Pro</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-800">
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 text-xs text-center">
          <div className="font-bold text-indigo-400 mb-1">Free Plan</div>
          <div className="text-gray-500">Groq: 14,400/day free</div>
        </div>
      </div>
    </aside>
  )
}
