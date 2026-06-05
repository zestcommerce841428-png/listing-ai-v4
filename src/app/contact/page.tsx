'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(v => ({ ...v, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (d.success) {
        setResult({ ok: true, msg: d.message ?? 'Message sent successfully!' })
        setForm({ name: '', email: '', subject: '', message: '' })
      } else {
        setResult({ ok: false, msg: d.error ?? 'Failed to send. Please try again.' })
      }
    } catch {
      setResult({ ok: false, msg: 'Network error. Please try again.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xs">LA</div>
          <span className="font-bold">ListingAI</span>
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-400 text-sm">Contact</span>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left */}
          <div>
            <h1 className="text-4xl font-black mb-4">Get in Touch</h1>
            <p className="text-gray-400 leading-relaxed mb-10">Have a question, feedback, or need help? We typically reply within 24 hours on business days.</p>

            <div className="space-y-6">
              {[
                { icon: '💬', title: 'General Support', desc: 'Questions about features, pricing, or how to use ListingAI', email: 'support@listingai.app' },
                { icon: '🔒', title: 'Privacy & Legal', desc: 'GDPR requests, data deletion, legal inquiries', email: 'privacy@listingai.app' },
                { icon: '🤝', title: 'Partnerships', desc: 'Agency partnerships, API access, enterprise plans', email: 'partners@listingai.app' },
              ].map(item => (
                <div key={item.title} className="flex gap-4">
                  <div className="text-2xl mt-0.5">{item.icon}</div>
                  <div>
                    <div className="font-semibold text-white">{item.title}</div>
                    <div className="text-gray-400 text-sm mt-0.5 mb-1">{item.desc}</div>
                    <a href={`mailto:${item.email}`} className="text-indigo-400 text-sm hover:underline">{item.email}</a>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-bold text-white mb-3">🚀 Quick Help</h3>
              <div className="space-y-2 text-sm">
                <Link href="/blog" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"><span>📚</span> Browse Documentation &amp; Blog</Link>
                <Link href="/dashboard/settings" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"><span>⚙️</span> API Key Setup Guide</Link>
                <Link href="/legal" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"><span>📋</span> Legal Documents</Link>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">Send us a message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Name *</label>
                  <input
                    type="text" name="name" required value={form.name} onChange={handleChange}
                    placeholder="John Smith"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Email *</label>
                  <input
                    type="email" name="email" required value={form.email} onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none placeholder-gray-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Subject *</label>
                <select
                  name="subject" required value={form.subject} onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Select a topic…</option>
                  <option>General Question</option>
                  <option>Technical Support</option>
                  <option>Feature Request</option>
                  <option>Bug Report</option>
                  <option>Partnership Inquiry</option>
                  <option>Privacy / Data Request</option>
                  <option>Billing Question</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Message *</label>
                <textarea
                  name="message" required value={form.message} onChange={handleChange}
                  rows={5} placeholder="Describe your question or issue in detail…"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none placeholder-gray-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm"
              >
                {sending ? 'Sending…' : 'Send Message'}
              </button>

              {result && (
                <div className={`mt-2 text-sm text-center rounded-lg p-3 ${
                  result.ok
                    ? 'text-green-400 bg-green-400/10 border border-green-400/20'
                    : 'text-red-400 bg-red-400/10 border border-red-400/20'
                }`}>
                  {result.ok ? '✅' : '❌'} {result.msg}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/terms" className="hover:text-gray-300">Terms</Link>
          <Link href="/privacy" className="hover:text-gray-300">Privacy</Link>
          <Link href="/cookies" className="hover:text-gray-300">Cookies</Link>
          <Link href="/legal" className="hover:text-gray-300">Legal</Link>
          <Link href="/blog" className="hover:text-gray-300">Blog</Link>
        </div>
      </footer>
    </div>
  )
}
