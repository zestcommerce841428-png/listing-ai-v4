import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Legal',
  description: 'ListingAI legal documents — Terms of Service, Privacy Policy, Cookie Policy, and more.',
}

const LEGAL_DOCS = [
  { title: 'Terms of Service', href: '/terms', icon: '📋', desc: 'Rules governing your use of the platform', updated: 'June 1, 2025' },
  { title: 'Privacy Policy', href: '/privacy', icon: '🔒', desc: 'How we collect, use, and protect your data. GDPR & CCPA compliant.', updated: 'June 1, 2025' },
  { title: 'Cookie Policy', href: '/cookies', icon: '🍪', desc: 'What cookies we use and how to manage them', updated: 'June 1, 2025' },
  { title: 'Acceptable Use Policy', href: '/acceptable-use', icon: '✅', desc: 'What you can and cannot do with our platform', updated: 'June 1, 2025' },
]

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xs">LA</div>
          <span className="font-bold">ListingAI</span>
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-400 text-sm">Legal</span>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black mb-3">Legal Documents</h1>
        <p className="text-gray-400 mb-12">All legal policies governing your use of ListingAI</p>

        <div className="grid md:grid-cols-2 gap-5 mb-16">
          {LEGAL_DOCS.map(doc => (
            <Link key={doc.href} href={doc.href} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-indigo-500/50 transition-colors block">
              <div className="text-3xl mb-4">{doc.icon}</div>
              <h2 className="font-bold text-white text-lg mb-2">{doc.title}</h2>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">{doc.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Updated {doc.updated}</span>
                <span className="text-indigo-400 text-sm">Read →</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-3">Questions about our legal policies?</h2>
          <p className="text-gray-400 mb-6">Our legal team is happy to help.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="mailto:legal@listingai.app" className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm">Email Legal Team</a>
            <a href="mailto:privacy@listingai.app" className="border border-gray-700 hover:border-gray-500 text-gray-300 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm">Privacy Questions</a>
          </div>
        </div>
      </div>
    </div>
  )
}
