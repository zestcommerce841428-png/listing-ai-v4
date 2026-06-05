import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Products' }
export default function ProductsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">Products</h1><p className="text-gray-400 text-sm mt-1">Manage all your product listings with pipeline status</p></div>
        <button className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">+ Add Product</button>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <div className="text-5xl mb-4">🗄️</div>
        <h3 className="text-xl font-bold text-white mb-2">Product Database</h3>
        <p className="text-gray-400 mb-4">Your products will appear here after generating via Queue or Content AI.</p>
        <div className="flex gap-3 justify-center">
          <a href="/dashboard/queue" className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">⚡ Go to Queue</a>
          <a href="/dashboard/content" className="border border-gray-700 hover:border-gray-500 text-gray-300 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">✍️ Content AI</a>
        </div>
      </div>
    </div>
  )
}
