import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://listingai.app'
  const now = new Date()
  return [
    { url: APP_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${APP_URL}/sign-in`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${APP_URL}/sign-up`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ]
}
