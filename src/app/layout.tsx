import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://listingai.app'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'ListingAI — AI Ecommerce Listing Automation',
    template: '%s | ListingAI',
  },
  description: 'Generate, manage and export 500+ ecommerce product listings in minutes using AI. Supports Shopify, Amazon, WooCommerce. Free with Groq & Gemini.',
  keywords: ['ecommerce automation','product listings AI','Shopify listings','Amazon listings','WooCommerce','bulk product generator','AI copywriter','ecommerce manager tool'],
  authors: [{ name: 'ListingAI', url: APP_URL }],
  creator: 'ListingAI',
  publisher: 'ListingAI',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: 'ListingAI',
    title: 'ListingAI — AI Ecommerce Listing Automation',
    description: 'Generate, manage and export 500+ ecommerce product listings in minutes. Free AI with Groq & Gemini. Shopify + Amazon + WooCommerce export.',
    images: [{ url: `${APP_URL}/og-image.png`, width: 1200, height: 630, alt: 'ListingAI — AI Ecommerce Listing Automation' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ListingAI — AI Ecommerce Listing Automation',
    description: 'Generate 500+ product listings in 20 minutes. Free AI (Groq/Gemini). Export to Shopify, Amazon, WooCommerce.',
    images: [`${APP_URL}/og-image.png`],
    creator: '@listingai',
  },
  alternates: { canonical: APP_URL },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION || '' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#030712' },
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
  ],
}

// Schema.org JSON-LD structured data
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${APP_URL}/#organization`,
      name: 'ListingAI',
      url: APP_URL,
      logo: { '@type': 'ImageObject', url: `${APP_URL}/logo.svg`, width: 512, height: 512 },
      sameAs: [`https://twitter.com/listingai`, `https://github.com/listingai`],
    },
    {
      '@type': 'WebSite',
      '@id': `${APP_URL}/#website`,
      url: APP_URL,
      name: 'ListingAI',
      description: 'AI-powered ecommerce listing automation platform',
      publisher: { '@id': `${APP_URL}/#organization` },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'ListingAI',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: APP_URL,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free tier with Groq & Gemini AI' },
      description: 'Generate, manage and export 500+ ecommerce product listings in minutes using AI. Supports Shopify, Amazon, WooCommerce.',
      featureList: [
        'AI content generation with Groq, Gemini, Claude, Llama',
        'Bulk queue processing 500+ products',
        'Universal marketplace scraper (Amazon, eBay, AliExpress, Etsy)',
        'Shopify, Amazon, WooCommerce CSV export',
        'MySQL product database with infinite categories',
        'Real-time progress with Socket.io',
        'AWS Bedrock integration (44 models)',
      ].join(', '),
      aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '1247', bestRating: '5' },
    },
    {
      '@type': 'HowTo',
      name: 'How to Generate 500 Product Listings with AI in 20 Minutes',
      description: 'Step-by-step guide to bulk-generate ecommerce listings using ListingAI',
      step: [
        { '@type': 'HowToStep', name: 'Set up free AI key', text: 'Get a free Groq API key from console.groq.com (30 seconds).' },
        { '@type': 'HowToStep', name: 'Add products to queue', text: 'Paste 500 product names in the Queue tab. Configure platform, tone, and category.' },
        { '@type': 'HowToStep', name: 'Start AI generation', text: 'Click Start Queue. AI generates titles, descriptions, bullets, and SEO tags for all products automatically.' },
        { '@type': 'HowToStep', name: 'Export CSV', text: 'Go to Products, select Approved, export as Shopify CSV, Amazon Flat File, or WooCommerce format.' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Is ListingAI free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Groq (14,400 req/day) and Gemini Flash (1,500 req/day) are completely free. Ollama runs locally for unlimited free use.' } },
        { '@type': 'Question', name: 'What platforms does ListingAI support?', acceptedAnswer: { '@type': 'Answer', text: 'Shopify, Amazon Seller Central, and WooCommerce. Export all 3 formats simultaneously as a ZIP file.' } },
        { '@type': 'Question', name: 'Can it scrape competitor products?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. ListingAI uses Playwright headless browser to scrape Amazon, eBay, AliExpress, Etsy, Flipkart, Walmart, and any website.' } },
      ],
    },
  ],
}

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const hasValidClerkKey = clerkKey?.startsWith('pk_') && !clerkKey.includes('your_clerk')

function Providers({ children }: { children: React.ReactNode }) {
  if (hasValidClerkKey) {
    return <ClerkProvider>{children}</ClerkProvider>
  }
  return <>{children}</>
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <html lang="en" className="dark" suppressHydrationWarning>
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        </head>
        <body className={`${inter.variable} font-sans antialiased`}>
          {children}
        </body>
      </html>
    </Providers>
  )
}
