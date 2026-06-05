import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Acceptable Use Policy',
  description: 'ListingAI Acceptable Use Policy — what you can and cannot do with our platform.',
}

export default function AcceptableUsePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xs">LA</div>
          <span className="font-bold">ListingAI</span>
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-400 text-sm">Acceptable Use Policy</span>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black mb-3">Acceptable Use Policy</h1>
        <p className="text-gray-400 mb-12">Last updated: June 1, 2025</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
            <p className="text-gray-300 leading-relaxed">This Acceptable Use Policy ("AUP") defines how you may use the ListingAI platform. Violations may result in immediate account suspension or termination.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">✅ Permitted Uses</h2>
            <ul className="space-y-2">
              {[
                'Creating product listings for legitimate ecommerce businesses',
                'Scraping publicly available product data from websites you have permission to access',
                'Generating AI content for your own products or client projects',
                'Exporting listings to Shopify, Amazon, WooCommerce for your own stores',
                'Research and competitive analysis for your own business',
                'Batch processing listings for efficiency in your workflow',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-gray-300">
                  <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">❌ Prohibited Uses</h2>
            <ul className="space-y-2">
              {[
                'Scraping websites that explicitly prohibit automated access in their Terms of Service',
                'Creating counterfeit, fake, or fraudulent product listings',
                'Generating content for illegal products or services',
                'Violating intellectual property rights (using copyrighted images/descriptions without permission)',
                'Circumventing marketplace policies (Amazon, eBay, etc.)',
                'Using the platform for spam or unsolicited marketing',
                'Attempting to overwhelm our servers with excessive requests',
                'Sharing account credentials with unauthorized users',
                'Using the service to harass, harm, or defraud others',
                'Generating misleading or deceptive product descriptions',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-gray-300">
                  <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Scraping Policy</h2>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5">
              <p className="text-yellow-200 text-sm leading-relaxed">
                <strong>Important:</strong> The web scraping feature is provided to help you collect product data from websites where you have legitimate access. You are solely responsible for ensuring your use complies with the target website's Terms of Service, robots.txt directives, and applicable laws. ListingAI takes no responsibility for your compliance with third-party terms.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Rate Limits</h2>
            <p className="text-gray-300 leading-relaxed mb-3">To ensure fair use for all users, we enforce:</p>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                ['Scraping', '30 requests/minute per user'],
                ['AI Generation', '500 products/hour per user'],
                ['Bulk Import', '5,000 products per request'],
                ['API calls', '1,000 requests/hour per user'],
              ].map(([feat, limit]) => (
                <div key={feat} className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex justify-between">
                  <span className="text-gray-300 text-sm font-medium">{feat}</span>
                  <span className="text-indigo-400 text-sm">{limit}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Enforcement</h2>
            <p className="text-gray-300 leading-relaxed">Violations of this AUP may result in:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4 mt-3">
              <li>Warning notification</li>
              <li>Temporary account suspension</li>
              <li>Permanent account termination</li>
              <li>Legal action where applicable</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Reporting Violations</h2>
            <p className="text-gray-300">Report misuse to <a href="mailto:abuse@listingai.app" className="text-indigo-400 hover:underline">abuse@listingai.app</a></p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-800 flex flex-wrap gap-4 text-sm text-gray-500">
          <Link href="/terms" className="hover:text-gray-300">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-gray-300">Privacy Policy</Link>
          <Link href="/cookies" className="hover:text-gray-300">Cookie Policy</Link>
          <Link href="/legal" className="hover:text-gray-300">Legal Hub</Link>
          <Link href="/" className="hover:text-gray-300">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
