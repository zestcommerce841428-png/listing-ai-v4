import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Content AI', description: 'AI content generation for ecommerce listings using Groq, Gemini, OpenAI, and AWS Bedrock.' }
export default function ContentPage() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-black text-white">Content AI</h1><p className="text-gray-400 text-sm mt-1">Generate titles, descriptions, bullet points, SEO tags with any AI provider</p></div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="font-bold text-white mb-4">AI Configuration</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[['Provider','groq'],['Model','Default'],['Tone','Professional'],['Platform','Shopify']].map(([l,v]) => (<div key={l}><label className="text-xs text-gray-400 font-semibold uppercase tracking-wide block mb-1">{l}</label><select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"><option>{v}</option></select></div>))}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2"><button className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-semibold">Single</button><button className="text-xs border border-gray-700 text-gray-400 px-3 py-1.5 rounded-lg">A/B</button></div>
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer"><input type="checkbox" className="accent-indigo-500"/>Save to DB automatically</label>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4">
        <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-white">Products</h2><button className="text-sm bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg transition-colors font-semibold">+ Add Product</button></div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Product Name *</label><input type="text" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" placeholder="Men's Cotton T-Shirt"/></div>
            <div><label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Keywords</label><input type="text" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" placeholder="cotton, slim fit"/></div>
            <div><label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Price</label><input type="text" className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" placeholder="29.99"/></div>
          </div>
        </div>
      </div>
      <button className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">🤖 Generate All Content</button>
    </div>
  )
}
