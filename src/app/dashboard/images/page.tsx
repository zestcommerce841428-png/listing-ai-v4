import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Image Downloader' }
export default function ImagesPage() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-black text-white">Image Downloader</h1><p className="text-gray-400 text-sm mt-1">Bulk download, rename, and optimize product images to WebP</p></div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-bold text-white mb-4">Bulk Image Download</h2>
          <div className="space-y-3">
            <div><label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Image URLs (one per line)</label><textarea className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white h-40 resize-none focus:border-indigo-500 focus:outline-none placeholder-gray-500" placeholder="https://cdn.example.com/product1.jpg&#10;https://cdn.example.com/product2.png&#10;..."/></div>
            <div><label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Custom Filenames (optional, match count)</label><textarea className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white h-20 resize-none focus:border-indigo-500 focus:outline-none placeholder-gray-500" placeholder="red-shirt-front&#10;red-shirt-back&#10;..."/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Optimize</label><select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"><option>Keep original</option><option>✅ Convert to WebP</option></select></div>
              <div><label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Max Width px</label><input type="number" defaultValue={1200} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"/></div>
            </div>
            <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-lg transition-colors text-sm">⬇️ Download All Images</button>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-bold text-white mb-4">Image CSV Mapper</h2>
          <p className="text-gray-400 text-sm mb-4">Upload CSV with SKU and image URL columns — downloads all images named by SKU</p>
          <div className="space-y-3">
            <div><label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">CSV File</label><input type="file" accept=".csv,.txt" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">SKU Column</label><input type="text" defaultValue="sku" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"/></div>
              <div><label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">URL Column</label><input type="text" defaultValue="url" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"/></div>
            </div>
            <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-lg transition-colors text-sm">🗺️ Map & Download</button>
          </div>
        </div>
      </div>
    </div>
  )
}
