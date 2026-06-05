import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'ListingAI Privacy Policy — how we collect, use, and protect your personal data. GDPR and CCPA compliant.',
}

const EFFECTIVE_DATE = 'June 1, 2025'
const CONTACT_EMAIL = 'privacy@listingai.app'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xs">LA</div>
          <span className="font-bold">ListingAI</span>
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-400 text-sm">Privacy Policy</span>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-black mb-3">Privacy Policy</h1>
          <p className="text-gray-400">Effective date: {EFFECTIVE_DATE} · GDPR &amp; CCPA Compliant</p>
        </div>

        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-5 mb-10">
          <p className="text-indigo-300 text-sm leading-relaxed"><strong>Summary:</strong> We collect minimal data to operate the service. We never sell your data. Your API keys are never stored on our servers — they stay in your browser session only. You can delete your account and all data at any time.</p>
        </div>

        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Who We Are</h2>
            <p className="text-gray-300 leading-relaxed">ListingAI ("we", "us", "our") operates the ListingAI platform — an AI-powered ecommerce listing automation tool. This Privacy Policy explains how we collect, use, store, and protect your personal information.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Data We Collect</h2>
            <div className="space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">Account Data</h3>
                <p className="text-gray-400 text-sm">Email address, name (via Clerk authentication). We use Clerk for auth — see <a href="https://clerk.com/privacy" className="text-indigo-400 hover:underline" target="_blank">Clerk's Privacy Policy</a>.</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">Product Data</h3>
                <p className="text-gray-400 text-sm">Product listings, categories, queue items you create — stored in our MySQL database to provide the service.</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">Usage Data</h3>
                <p className="text-gray-400 text-sm">Pages visited, features used, error logs. Used to improve the service.</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">What We Do NOT Collect</h3>
                <ul className="text-gray-400 text-sm list-disc list-inside space-y-1">
                  <li>API keys (stored in your browser sessionStorage only)</li>
                  <li>Payment information (no paid plans currently)</li>
                  <li>Passwords (handled entirely by Clerk)</li>
                  <li>Third-party marketplace credentials</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Data</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>To provide, maintain, and improve the Service</li>
              <li>To authenticate your identity and protect your account</li>
              <li>To send essential service communications (no marketing without consent)</li>
              <li>To analyse usage patterns to improve features</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Data Sharing</h2>
            <p className="text-gray-300 leading-relaxed mb-3">We share data only with:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
              <li><strong>Clerk</strong> — authentication provider</li>
              <li><strong>Cloud infrastructure</strong> — hosting (data stays in your chosen region)</li>
              <li><strong>Legal authorities</strong> — only when required by law</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-3 font-semibold">We never sell, rent, or trade your personal data.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Data Retention</h2>
            <p className="text-gray-300 leading-relaxed">We retain your data for as long as your account is active. When you delete your account, we permanently delete all your data within 30 days, except where required by law.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights (GDPR / CCPA)</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                ['Right to Access', 'Request a copy of your personal data'],
                ['Right to Rectification', 'Correct inaccurate data'],
                ['Right to Erasure', 'Delete your account and all data'],
                ['Right to Portability', 'Export your data in JSON/CSV format'],
                ['Right to Object', 'Opt out of processing for marketing'],
                ['Right to Restriction', 'Limit how we process your data'],
              ].map(([right, desc]) => (
                <div key={right} className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                  <div className="font-semibold text-white text-sm mb-1">{right}</div>
                  <div className="text-gray-400 text-xs">{desc}</div>
                </div>
              ))}
            </div>
            <p className="text-gray-300 text-sm mt-4">To exercise these rights, contact us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-400 hover:underline">{CONTACT_EMAIL}</a>. We respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Security</h2>
            <p className="text-gray-300 leading-relaxed">We implement industry-standard security measures including TLS encryption in transit, encrypted storage at rest, Redis rate limiting, security headers (HSTS, CSP, X-Frame-Options), and regular security audits.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Cookies</h2>
            <p className="text-gray-300 leading-relaxed">We use essential cookies for authentication and session management. See our <Link href="/cookies" className="text-indigo-400 hover:underline">Cookie Policy</Link> for details.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Contact & Data Protection Officer</h2>
            <p className="text-gray-300">Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-400 hover:underline">{CONTACT_EMAIL}</a></p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-800 flex flex-wrap gap-4 text-sm text-gray-500">
          <Link href="/terms" className="hover:text-gray-300">Terms of Service</Link>
          <Link href="/cookies" className="hover:text-gray-300">Cookie Policy</Link>
          <Link href="/acceptable-use" className="hover:text-gray-300">Acceptable Use</Link>
          <Link href="/legal" className="hover:text-gray-300">Legal Hub</Link>
          <Link href="/" className="hover:text-gray-300">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
