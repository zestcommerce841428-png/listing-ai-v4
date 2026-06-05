import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Categories' }
export default function CategoriesPage() {
  const defaultCats = [
    { icon:'📦',name:'General',color:'#6366f1' },{ icon:'💻',name:'Electronics',color:'#3b82f6' },
    { icon:'👕',name:'Clothing',color:'#a78bfa' },{ icon:'💄',name:'Beauty',color:'#f472b6' },
    { icon:'🏠',name:'Home & Living',color:'#22d3ee' },{ icon:'🏃',name:'Sports',color:'#22c55e' },
    { icon:'🍎',name:'Food',color:'#f59e0b' },{ icon:'🧸',name:'Toys',color:'#fb923c' },
    { icon:'🔨',name:'Tools',color:'#64748b' },{ icon:'🚗',name:'Automotive',color:'#ef4444' },
  ]
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">Categories</h1><p className="text-gray-400 text-sm mt-1">Custom categories with AI prompt hints per category</p></div>
        <button className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">+ New Category</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {defaultCats.map(c => (
          <div key={c.name} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-indigo-500/50 transition-colors cursor-pointer" style={{borderLeft:`3px solid ${c.color}`}}>
            <div className="text-3xl mb-2">{c.icon}</div>
            <div className="font-semibold text-white text-sm">{c.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">Built-in</div>
          </div>
        ))}
        <div className="bg-gray-900 border-2 border-dashed border-gray-700 rounded-xl p-4 hover:border-indigo-500/50 transition-colors cursor-pointer flex flex-col items-center justify-center text-center min-h-[100px]">
          <div className="text-3xl mb-2">+</div>
          <div className="text-sm text-gray-400">Add Custom Category</div>
        </div>
      </div>
    </div>
  )
}
