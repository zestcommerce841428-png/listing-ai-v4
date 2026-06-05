import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Marketplace Scraper', description: 'Scrape product data from Amazon, eBay, AliExpress, Etsy, Flipkart, Walmart and any website.' }
export default function ScraperPage() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-black text-white">Marketplace Scraper</h1><p className="text-gray-400 text-sm mt-1">Playwright headless browser — handles Amazon, eBay, AliExpress, Etsy, Flipkart, Walmart and any JS-heavy site</p></div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="font-bold text-white mb-4">Single Product Scraper</h2>
        <div className="flex gap-2">
          <input type="url" placeholder="https://amazon.com/dp/... or any product page URL" className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none placeholder-gray-500"/>
          <button className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm whitespace-nowrap">🔍 Scrape</button>
        </div>
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">✓ Amazon</span>
          <span className="flex items-center gap-1">✓ eBay</span>
          <span className="flex items-center gap-1">✓ AliExpress</span>
          <span className="flex items-center gap-1">✓ Etsy</span>
          <span className="flex items-center gap-1">✓ Flipkart</span>
          <span className="flex items-center gap-1">✓ Walmart</span>
          <span className="flex items-center gap-1">✓ Any site</span>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-white mb-4">Batch Scraper (Streaming)</h2>
        <p className="text-gray-400 text-sm mb-4">Paste multiple URLs — streams results live as each page is scraped</p>
        <textarea className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white resize-none h-32 focus:border-indigo-500 focus:outline-none placeholder-gray-500 mb-3" placeholder="https://amazon.com/dp/...&#10;https://ebay.com/itm/...&#10;https://aliexpress.com/item/..."/>
        <div className="flex gap-3">
          <button className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm">🔍 Batch Scrape (Streaming)</button>
          <button className="border border-gray-700 hover:border-gray-500 text-gray-300 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">+ All to Queue</button>
        </div>
      </div>
    </div>
  )
}
