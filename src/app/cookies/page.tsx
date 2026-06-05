import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'ListingAI Cookie Policy — what cookies we use and how to manage them.',
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xs">LA</div>
          <span className="font-bold">ListingAI</span>
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-400 text-sm">Cookie Policy</span>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black mb-3">Cookie Policy</h1>
        <p className="text-gray-400 mb-12">Last updated: June 1, 2025</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">What Are Cookies?</h2>
            <p className="text-gray-300 leading-relaxed">Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and function correctly.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Cookies We Use</h2>
            <div className="space-y-4">
              {[
                {
                  type: 'Essential Cookies',
                  required: true,
                  purpose: 'Required for the platform to function.',
                  examples: [
                    { name: '__clerk_session', purpose: 'Authentication session (Clerk)', duration: 'Session' },
                    { name: '__session', purpose: 'User session management', duration: '7 days' },
                    { name: 'csrf_token', purpose: 'CSRF attack prevention', duration: 'Session' },
                  ]
                },
                {
                  type: 'Analytics Cookies',
                  required: false,
                  purpose: 'Help us understand how the platform is used (anonymised).',
                  examples: [
                    { name: '_ga', purpose: 'Google Analytics', duration: '2 years' },
                  ]
                },
                {
                  type: 'Preference Cookies',
                  required: false,
                  purpose: 'Remember your settings.',
                  examples: [
                    { name: 'theme', purpose: 'Dark/light mode preference', duration: '1 year' },
                  ]
                },
              ].map(cat => (
                <div key={cat.type} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{cat.type}</h3>
                      <p className="text-gray-400 text-sm mt-0.5">{cat.purpose}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cat.required ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-700 text-gray-400'}`}>
                      {cat.required ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  <table className="w-full border-t border-gray-800">
                    <thead><tr className="bg-gray-800/50"><th className="text-left px-5 py-2 text-xs text-gray-400">Cookie Name</th><th className="text-left px-5 py-2 text-xs text-gray-400">Purpose</th><th className="text-left px-5 py-2 text-xs text-gray-400">Duration</th></tr></thead>
                    <tbody>
                      {cat.examples.map(c => (
                        <tr key={c.name} className="border-t border-gray-800/50">
                          <td className="px-5 py-2.5 text-sm font-mono text-indigo-300">{c.name}</td>
                          <td className="px-5 py-2.5 text-sm text-gray-400">{c.purpose}</td>
                          <td className="px-5 py-2.5 text-sm text-gray-400">{c.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Managing Cookies</h2>
            <p className="text-gray-300 leading-relaxed mb-3">You can control cookies through:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Browser settings</strong> — block or delete cookies in Chrome, Firefox, Safari, Edge</li>
              <li><strong>Account settings</strong> — manage analytics preferences in Settings</li>
              <li><strong>Opt-out tools</strong> — Google Analytics opt-out browser add-on</li>
            </ul>
            <p className="text-gray-400 text-sm mt-3">Note: Blocking essential cookies will prevent you from using the platform.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
            <p className="text-gray-300">Questions? Email <a href="mailto:privacy@listingai.app" className="text-indigo-400 hover:underline">privacy@listingai.app</a></p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-800 flex flex-wrap gap-4 text-sm text-gray-500">
          <Link href="/terms" className="hover:text-gray-300">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-gray-300">Privacy Policy</Link>
          <Link href="/acceptable-use" className="hover:text-gray-300">Acceptable Use</Link>
          <Link href="/" className="hover:text-gray-300">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
