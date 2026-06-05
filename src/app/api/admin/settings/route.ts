import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getAllSettings, setSetting, setBulkSettings, DEFAULT_SETTINGS } from '@/lib/settings'
import { delCache } from '@/lib/redis'

async function isAdmin(clerkId: string): Promise<boolean> {
  const superAdminId = await prisma.siteSetting.findFirst({ where: { key: 'super_admin_clerk_id' } })
  if (superAdminId?.value === clerkId) return true
  const admin = await prisma.adminUser.findFirst({ where: { clerkId, isActive: true } })
  return !!admin
}

// GET /api/admin/settings
export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isAdmin(clerkId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const group = searchParams.get('group')

  const settings = await prisma.siteSetting.findMany({
    where: group ? { group } : undefined,
    orderBy: [{ group: 'asc' }, { key: 'asc' }],
  })
  return NextResponse.json({ settings })
}

// POST /api/admin/settings — bulk update or seed defaults
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isAdmin(clerkId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  // Seed defaults
  if (body.action === 'seed') {
    for (const s of DEFAULT_SETTINGS) {
      await prisma.siteSetting.upsert({ where: { key: s.key }, update: {}, create: s })
    }
    await delCache('site:settings:all')
    return NextResponse.json({ success: true, seeded: DEFAULT_SETTINGS.length })
  }

  // Bulk update
  if (body.settings && typeof body.settings === 'object') {
    await setBulkSettings(body.settings)
    return NextResponse.json({ success: true })
  }

  // Single update
  const { key, value, label, group, type } = body
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })
  await setSetting(key, value || '', label, group, type)
  return NextResponse.json({ success: true })
}
