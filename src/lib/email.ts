/**
 * ListingAI — Multi-provider SMTP Email Service
 * Supports: Gmail, Microsoft/Outlook, Hostinger, custom SMTP
 */
import nodemailer from 'nodemailer'
import { prisma } from './prisma'

export type EmailProvider = 'gmail' | 'microsoft' | 'hostinger' | 'custom'

export interface EmailConfig {
  provider: EmailProvider
  host?: string
  port?: number
  secure?: boolean
  user: string
  pass: string
  fromName?: string
  fromEmail?: string
}

const PROVIDER_DEFAULTS: Record<EmailProvider, Partial<EmailConfig>> = {
  gmail: { host: 'smtp.gmail.com', port: 587, secure: false },
  microsoft: { host: 'smtp.office365.com', port: 587, secure: false },
  hostinger: { host: 'smtp.hostinger.com', port: 587, secure: false },
  custom: {},
}

async function getSMTPConfig(): Promise<EmailConfig | null> {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: { group: 'smtp' },
    })
    const map: Record<string, string> = {}
    settings.forEach(s => { map[s.key] = s.value })
    if (!map['smtp_user'] || !map['smtp_pass']) return null
    const provider = (map['smtp_provider'] || 'custom') as EmailProvider
    return {
      provider,
      host: map['smtp_host'] || PROVIDER_DEFAULTS[provider]?.host || '',
      port: parseInt(map['smtp_port'] || '587'),
      secure: map['smtp_secure'] === 'true',
      user: map['smtp_user'],
      pass: map['smtp_pass'],
      fromName: map['smtp_from_name'] || 'ListingAI',
      fromEmail: map['smtp_from_email'] || map['smtp_user'],
    }
  } catch {
    return null
  }
}

function createTransporter(config: EmailConfig) {
  const defaults = PROVIDER_DEFAULTS[config.provider] || {}
  return nodemailer.createTransport({
    host: config.host || defaults.host,
    port: config.port || defaults.port || 587,
    secure: config.secure ?? defaults.secure ?? false,
    auth: { user: config.user, pass: config.pass },
    tls: { rejectUnauthorized: false },
  })
}

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export async function sendEmail(opts: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const config = await getSMTPConfig()
  if (!config) return { success: false, error: 'SMTP not configured. Set up email in Admin → Settings.' }

  try {
    const transporter = createTransporter(config)
    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text || opts.html.replace(/<[^>]+>/g, ''),
      replyTo: opts.replyTo,
    })
    return { success: true }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// Email templates
export function contactReplyTemplate(name: string, originalMessage: string, reply: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: 'Segoe UI', sans-serif; background:#0d0f18; color:#e2e8f0; margin:0; padding:20px">
  <div style="max-width:600px; margin:0 auto; background:#161928; border-radius:12px; overflow:hidden; border:1px solid #2a2f4a">
    <div style="background:linear-gradient(135deg,#6366f1,#22d3ee); padding:28px 32px">
      <div style="font-size:22px; font-weight:800; color:white">ListingAI</div>
      <div style="font-size:14px; color:rgba(255,255,255,0.8); margin-top:4px">Reply to your message</div>
    </div>
    <div style="padding:32px">
      <p style="font-size:16px; margin-bottom:20px">Hi ${name},</p>
      <p style="color:#94a3b8; font-size:14px; margin-bottom:20px">Thank you for contacting us. Here is our reply to your message:</p>
      <div style="background:#1e2236; border-left:4px solid #6366f1; padding:16px; border-radius:8px; margin-bottom:24px">
        <p style="font-size:12px; color:#6b7280; margin-bottom:8px">Your original message:</p>
        <p style="font-size:14px; color:#94a3b8; font-style:italic">${originalMessage}</p>
      </div>
      <div style="background:#1e2236; border-left:4px solid #22d3ee; padding:16px; border-radius:8px; margin-bottom:24px">
        <p style="font-size:12px; color:#6b7280; margin-bottom:8px">Our reply:</p>
        <p style="font-size:14px; line-height:1.7">${reply}</p>
      </div>
      <p style="color:#94a3b8; font-size:13px">Need further help? Just reply to this email.</p>
    </div>
    <div style="padding:20px 32px; background:#111827; text-align:center">
      <p style="font-size:12px; color:#4b5563">© ${new Date().getFullYear()} ListingAI · <a href="${process.env.NEXT_PUBLIC_APP_URL}/terms" style="color:#6366f1">Terms</a> · <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy" style="color:#6366f1">Privacy</a></p>
    </div>
  </div>
</body>
</html>`
}

export function contactNotifyTemplate(name: string, email: string, subject: string, message: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif; background:#f9fafb; padding:20px">
  <div style="max-width:600px; margin:0 auto; background:white; border-radius:8px; padding:24px; border:1px solid #e5e7eb">
    <h2 style="color:#1f2937">New Contact Message</h2>
    <table style="width:100%; border-collapse:collapse; margin:16px 0">
      <tr><td style="padding:8px 0; color:#6b7280; width:80px">From:</td><td style="font-weight:600">${name} &lt;${email}&gt;</td></tr>
      <tr><td style="padding:8px 0; color:#6b7280">Subject:</td><td>${subject}</td></tr>
    </table>
    <div style="background:#f3f4f6; border-radius:6px; padding:16px; margin-top:12px">
      <p style="color:#374151; line-height:1.7; white-space:pre-wrap">${message}</p>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/contact" style="display:inline-block; margin-top:20px; background:#6366f1; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:600">Reply in Admin →</a>
  </div>
</body>
</html>`
}
