import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'ListingAI Terms of Service — understand your rights and responsibilities when using our platform.',
  robots: { index: true, follow: true },
}

const APP_NAME = 'ListingAI'
const CONTACT_EMAIL = 'legal@listingai.app'
const EFFECTIVE_DATE = 'June 1, 2025'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xs">LA</div>
          <span className="font-bold">{APP_NAME}</span>
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-400 text-sm">Terms of Service</span>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-black mb-3">Terms of Service</h1>
          <p className="text-gray-400">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-10">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300 leading-relaxed">By accessing or using {APP_NAME} ("Service", "Platform", "we", "us"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. These terms apply to all visitors, users, and others who access the Service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
            <p className="text-gray-300 leading-relaxed mb-3">{APP_NAME} is an AI-powered ecommerce listing automation platform that provides:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
              <li>AI-generated product titles, descriptions, bullet points, and SEO tags</li>
              <li>Product data extraction from public marketplace URLs</li>
              <li>CSV export for Shopify, Amazon, and WooCommerce</li>
              <li>Product database management with pipeline tracking</li>
              <li>Bulk queue processing for high-volume listing creation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
            <p className="text-gray-300 leading-relaxed mb-3">To access the Service, you must create an account. You agree to:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized use</li>
              <li>Be responsible for all activity under your account</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-3">You must be at least 18 years old to use the Service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Acceptable Use</h2>
            <p className="text-gray-300 leading-relaxed mb-3">You agree NOT to use the Service to:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
              <li>Scrape websites in violation of their Terms of Service</li>
              <li>Generate content that is false, misleading, or fraudulent</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe intellectual property rights of others</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Use automated tools to overload our infrastructure</li>
              <li>Resell or sublicense the Service without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. AI-Generated Content</h2>
            <p className="text-gray-300 leading-relaxed mb-3">You acknowledge that:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
              <li>AI-generated content may contain errors or inaccuracies</li>
              <li>You are responsible for reviewing content before publishing</li>
              <li>We do not guarantee the accuracy of any AI-generated output</li>
              <li>You retain ownership of content you create using the Service</li>
              <li>We may use aggregated, anonymized data to improve our models</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Third-Party AI Providers</h2>
            <p className="text-gray-300 leading-relaxed">The Service integrates with third-party AI providers including Groq, Google Gemini, OpenAI, AWS Bedrock, and Ollama. Your use of these integrations is also subject to the respective providers' terms of service. We are not responsible for the policies or practices of third-party providers.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Intellectual Property</h2>
            <p className="text-gray-300 leading-relaxed">The Service and its original content, features, and functionality are owned by {APP_NAME} and are protected by international copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our explicit written permission.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Disclaimer of Warranties</h2>
            <p className="text-gray-300 leading-relaxed uppercase text-sm">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">To the maximum extent permitted by applicable law, {APP_NAME} shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the Service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Termination</h2>
            <p className="text-gray-300 leading-relaxed">We reserve the right to suspend or terminate your account at any time for violations of these Terms. You may delete your account at any time from your Settings page. Upon termination, your right to use the Service ceases immediately.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Changes to Terms</h2>
            <p className="text-gray-300 leading-relaxed">We may update these Terms at any time. We will notify you via email or in-app notification. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">12. Governing Law</h2>
            <p className="text-gray-300 leading-relaxed">These Terms are governed by and construed in accordance with applicable law. Any disputes shall be resolved through binding arbitration.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">13. Contact</h2>
            <p className="text-gray-300 leading-relaxed">For questions about these Terms, contact us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-400 hover:underline">{CONTACT_EMAIL}</a></p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-800 flex flex-wrap gap-4 text-sm text-gray-500">
          <Link href="/privacy" className="hover:text-gray-300">Privacy Policy</Link>
          <Link href="/cookies" className="hover:text-gray-300">Cookie Policy</Link>
          <Link href="/acceptable-use" className="hover:text-gray-300">Acceptable Use</Link>
          <Link href="/legal" className="hover:text-gray-300">Legal Hub</Link>
          <Link href="/" className="hover:text-gray-300">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
