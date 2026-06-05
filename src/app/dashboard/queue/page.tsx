import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Bulk Queue' }
export default function QueuePage() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-black text-white">Bulk Queue</h1><p className="text-gray-400 text-sm mt-1">Add 500+ product names, configure AI, and generate all automatically</p></div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-bold text-white mb-4">Add Products to Queue</h2>
          <div className="space-y-3">
            <div><label className="text-xs text-gray-400 font-semibold uppercase tracking-wide block mb-1">Product Names (one per line)</label><textarea className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white resize-none h-40 focus:border-indigo-500 focus:outline-none" placeholder="Men's Cotton T-Shirt&#10;Wireless Charging Pad&#10;Yoga Mat 6mm&#10;..."/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-400 font-semibold uppercase tracking-wide block mb-1">Platform</label><select className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-white focus:border-indigo-500 focus:outline-none"><option value="shopify">Shopify</option><option value="amazon">Amazon</option></select></div>
              <div><label className="text-xs text-gray-400 font-semibold uppercase tracking-wide block mb-1">Tone</label><select className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-white focus:border-indigo-500 focus:outline-none"><option>Professional</option><option>Friendly</option><option>Luxury</option><option>Technical</option></select></div>
            </div>
            <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm">+ Add to Queue</button>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-bold text-white mb-4">Queue Status</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[['0','Total'],['0','Pending'],['0','Done'],['0','Errors']].map(([v,l]) => (<div key={l} className="bg-gray-800 rounded-lg p-3 text-center"><div className="text-2xl font-black text-white">{v}</div><div className="text-xs text-gray-400">{l}</div></div>))}
          </div>
          <div className="space-y-3">
            <div><label className="text-xs text-gray-400 font-semibold uppercase tracking-wide block mb-1">AI Provider</label>
              <div className="flex gap-2 flex-wrap">
                {[['Groq','#f97316'],['Gemini','#4285f4'],['Ollama','#22c55e'],['Bedrock','#ff9900']].map(([p,c]) => (<button key={p} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-600 text-gray-400 hover:text-white" style={{}}>{p}</button>))}
              </div>
            </div>
            <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors">▶ Start Queue Processor</button>
          </div>
        </div>
      </div>
    </div>
  )
}
