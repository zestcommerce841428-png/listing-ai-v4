import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, contactNotifyTemplate } from '@/lib/email'
import { getSetting } from '@/lib/settings'
import { checkRateLimit } from '@/lib/redis'

// POST /api/contact — submit contact form
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const allowed = await checkRateLimit(`contact:${ip}`, 3, 3600) // 3 per hour per IP
  if (!allowed) return NextResponse.json({ error: 'Too many messages. Please wait 1 hour.' }, { status: 429 })

  const { name, email, subject, message, recaptchaToken } = await req.json()

  // Validate
  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }
  if (message.length < 10) return NextResponse.json({ error: 'Message too short' }, { status: 400 })
  if (message.length > 5000) return NextResponse.json({ error: 'Message too long (max 5000 chars)' }, { status: 400 })

  // Verify reCAPTCHA v3 if configured
  const recaptchaSecret = await getSetting('recaptcha_v3_secret_key')
  if (recaptchaSecret && recaptchaToken) {
    const verifyRes = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`, { method: 'POST' })
    const verifyData = await verifyRes.json()
    if (!verifyData.success || verifyData.score < 0.5) {
      return NextResponse.json({ error: 'reCAPTCHA verification failed. Please try again.' }, { status: 400 })
    }
  }

  // Save to database
  const msg = await prisma.contactMessage.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      ip,
      userAgent: req.headers.get('user-agent') || '',
    },
  })

  // Send notification to admin
  const adminEmail = await getSetting('admin_email')
  if (adminEmail) {
    await sendEmail({
      to: adminEmail,
      subject: `[ListingAI] New Contact: ${subject}`,
      html: contactNotifyTemplate(name, email, subject, message),
    }).catch(() => {}) // don't fail the request if email fails
  }

  return NextResponse.json({ success: true, id: msg.id, message: 'Your message has been sent. We will reply within 24 hours.' }, { status: 201 })
}

// GET /api/contact — admin only, list messages
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status') || undefined
  const skip = (page - 1) * limit

  const [messages, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
    prisma.contactMessage.count({ where: status ? { status } : undefined }),
  ])

  const statusCounts = await prisma.contactMessage.groupBy({ by: ['status'], _count: true })
  const counts: Record<string, number> = {}
  statusCounts.forEach(s => { counts[s.status] = s._count })

  return NextResponse.json({ messages, total, page, pages: Math.ceil(total / limit), statusCounts: counts })
}
