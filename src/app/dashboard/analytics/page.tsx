import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Analytics', description: 'Analytics dashboard for your ecommerce product listings.' }
export default function AnalyticsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">Analytics</h1><p className="text-gray-400 text-sm mt-1">Product listing performance and data insights</p></div>
        <button className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">📊 Refresh</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[['Total Products','0','🗄️'],['Avg SEO Score','—','📊'],['Avg Price','—','💰'],['With Images','0','🖼️']].map(([l,v,i]) => (
          <div key={l} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="text-2xl mb-2">{i}</div>
            <div className="text-3xl font-black text-white">{v}</div>
            <div className="text-sm text-gray-400 mt-1">{l}</div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        {[['💰 Price Distribution','Price range breakdown of your listings'],['✅ Listing Completeness','Required and recommended field coverage'],['🔑 Top Keywords','Most used keywords across all tags'],['📦 Product Types','Distribution of product categories']].map(([t,d]) => (
          <div key={t as string} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="font-bold text-white mb-1">{t}</h3>
            <p className="text-gray-500 text-xs mb-4">{d}</p>
            <div className="text-center py-8 text-gray-600 text-sm">Generate products first to see analytics</div>
          </div>
        ))}
      </div>
    </div>
  )
}
