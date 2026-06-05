import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'CSV Export', description: 'Export product listings as Shopify CSV, Amazon flat file, or WooCommerce format.' }
export default function ExportPage() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-black text-white">CSV Export</h1><p className="text-gray-400 text-sm mt-1">Build listing rows and export to Shopify, Amazon, or WooCommerce</p></div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex gap-3 items-center flex-wrap">
            <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"><option>Shopify</option><option>Amazon Flat File</option><option>WooCommerce</option></select>
            <button className="text-sm border border-gray-700 hover:border-gray-500 text-gray-300 px-3 py-2 rounded-lg transition-colors">+ Row</button>
            <button className="text-sm bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-lg transition-colors font-semibold">⬆️ Import from AI</button>
            <button className="text-sm border border-gray-700 hover:border-gray-500 text-gray-300 px-3 py-2 rounded-lg transition-colors">📂 Import CSV</button>
            <button className="text-sm border border-gray-700 hover:border-gray-500 text-gray-300 px-3 py-2 rounded-lg transition-colors">🔀 Variants</button>
          </div>
          <div className="flex gap-3">
            <button className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors">📥 Export CSV</button>
            <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-4 py-2 rounded-lg text-sm transition-colors">📦 Export All 3</button>
          </div>
        </div>
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">📋</div>
          <p>Add listings above or import from AI / CSV file</p>
        </div>
      </div>
    </div>
  )
}
