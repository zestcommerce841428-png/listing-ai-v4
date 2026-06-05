/**
 * Site Settings helper — reads/writes from SiteSetting table
 */
import { prisma } from './prisma'
import { getCache, setCache, delCache } from './redis'

const SETTINGS_CACHE_KEY = 'site:settings:all'
const SETTINGS_TTL = 300 // 5 minutes

export interface SiteSettings {
  // General
  siteName: string
  siteTagline: string
  siteUrl: string
  siteLogo: string
  supportEmail: string
  // SEO
  googleAnalyticsId: string
  googleAdsenseId: string
  googleSiteVerification: string
  // Integrations
  recaptchaV3SiteKey: string
  recaptchaV3SecretKey: string
  tawkPropertyId: string
  tawkWidgetId: string
  whatsappNumber: string
  whatsappMessage: string
  // SMTP (handled separately via getSMTPConfig)
  // Features
  maintenanceMode: string
  allowRegistration: string
  maxProductsPerUser: string
  // Ads
  headerAdCode: string
  footerAdCode: string
  sidebarAdCode: string
  // Blog
  blogEnabled: string
  postsPerPage: string
  // Admin
  adminEmail: string
  superAdminClerkId: string
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const cached = await getCache<Record<string, string>>(SETTINGS_CACHE_KEY)
  if (cached) return cached
  const rows = await prisma.siteSetting.findMany()
  const map: Record<string, string> = {}
  rows.forEach(r => { map[r.key] = r.value })
  await setCache(SETTINGS_CACHE_KEY, map, SETTINGS_TTL)
  return map
}

export async function getSetting(key: string, fallback = ''): Promise<string> {
  const all = await getAllSettings()
  return all[key] ?? fallback
}

export async function setSetting(key: string, value: string, label?: string, group?: string, type?: string): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value, label: label || key, group: group || 'general', type: type || 'string' },
  })
  await delCache(SETTINGS_CACHE_KEY)
}

export async function setBulkSettings(settings: Record<string, string>): Promise<void> {
  const ops = Object.entries(settings).map(([key, value]) =>
    prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, label: key, group: 'general', type: 'string' },
    })
  )
  await prisma.$transaction(ops)
  await delCache(SETTINGS_CACHE_KEY)
}

// Default settings to seed on first install
export const DEFAULT_SETTINGS: Array<{ key: string; value: string; label: string; group: string; type: string }> = [
  // General
  { key: 'site_name', value: 'ListingAI', label: 'Site Name', group: 'general', type: 'string' },
  { key: 'site_tagline', value: 'AI-Powered Ecommerce Listing Automation', label: 'Site Tagline', group: 'general', type: 'string' },
  { key: 'support_email', value: 'support@listingai.app', label: 'Support Email', group: 'general', type: 'string' },
  { key: 'admin_email', value: 'admin@listingai.app', label: 'Admin Notification Email', group: 'general', type: 'string' },
  // Features
  { key: 'maintenance_mode', value: 'false', label: 'Maintenance Mode', group: 'features', type: 'boolean' },
  { key: 'allow_registration', value: 'true', label: 'Allow New Registrations', group: 'features', type: 'boolean' },
  { key: 'max_products_per_user', value: '50000', label: 'Max Products Per User (0 = unlimited)', group: 'features', type: 'number' },
  // SEO
  { key: 'google_analytics_id', value: '', label: 'Google Analytics ID (G-XXXXXXXX)', group: 'seo', type: 'string' },
  { key: 'google_adsense_id', value: '', label: 'Google AdSense Publisher ID (ca-pub-XXXX)', group: 'seo', type: 'string' },
  { key: 'google_site_verification', value: '', label: 'Google Search Console Verification', group: 'seo', type: 'string' },
  // Integrations
  { key: 'recaptcha_v3_site_key', value: '', label: 'reCAPTCHA v3 Site Key', group: 'integrations', type: 'string' },
  { key: 'recaptcha_v3_secret_key', value: '', label: 'reCAPTCHA v3 Secret Key', group: 'integrations', type: 'secret' },
  { key: 'tawk_property_id', value: '', label: 'Tawk.to Property ID', group: 'integrations', type: 'string' },
  { key: 'tawk_widget_id', value: '', label: 'Tawk.to Widget ID', group: 'integrations', type: 'string' },
  { key: 'whatsapp_number', value: '', label: 'WhatsApp Number (with country code)', group: 'integrations', type: 'string' },
  { key: 'whatsapp_message', value: 'Hi ListingAI Support!', label: 'WhatsApp Default Message', group: 'integrations', type: 'string' },
  // SMTP
  { key: 'smtp_provider', value: 'gmail', label: 'SMTP Provider', group: 'smtp', type: 'select' },
  { key: 'smtp_host', value: 'smtp.gmail.com', label: 'SMTP Host', group: 'smtp', type: 'string' },
  { key: 'smtp_port', value: '587', label: 'SMTP Port', group: 'smtp', type: 'number' },
  { key: 'smtp_secure', value: 'false', label: 'SMTP Secure (TLS)', group: 'smtp', type: 'boolean' },
  { key: 'smtp_user', value: '', label: 'SMTP Username / Email', group: 'smtp', type: 'string' },
  { key: 'smtp_pass', value: '', label: 'SMTP Password / App Password', group: 'smtp', type: 'secret' },
  { key: 'smtp_from_name', value: 'ListingAI', label: 'From Name', group: 'smtp', type: 'string' },
  { key: 'smtp_from_email', value: '', label: 'From Email', group: 'smtp', type: 'string' },
  // Blog
  { key: 'blog_enabled', value: 'true', label: 'Enable Blog', group: 'blog', type: 'boolean' },
  { key: 'posts_per_page', value: '12', label: 'Posts Per Page', group: 'blog', type: 'number' },
  // Custom Code
  { key: 'header_ad_code', value: '', label: 'Header Ad / Script Code', group: 'ads', type: 'code' },
  { key: 'footer_ad_code', value: '', label: 'Footer Ad / Script Code', group: 'ads', type: 'code' },
  { key: 'custom_css', value: '', label: 'Custom CSS', group: 'ads', type: 'code' },
]
