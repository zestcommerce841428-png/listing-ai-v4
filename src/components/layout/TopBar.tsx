'use client'

import { usePathname } from 'next/navigation'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/products': 'Products',
  '/dashboard/queue': 'Bulk Queue',
  '/dashboard/scraper': 'Marketplace Scraper',
  '/dashboard/content': 'Content AI',
  '/dashboard/export': 'CSV Export',
  '/dashboard/images': 'Image Downloader',
  '/dashboard/categories': 'Categories',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/settings': 'Settings',
}

export function TopBar() {
  const pathname = usePathname()
  const title = PAGE_TITLES[pathname] || 'ListingAI'

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="font-bold text-white">{title}</h1>
      <div className="flex items-center gap-4">
        <span className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-1 rounded-full">
          ● Live
        </span>
        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold text-white cursor-pointer hover:bg-indigo-600 transition-colors" title="Account">
          U
        </div>
      </div>
    </header>
  )
}
