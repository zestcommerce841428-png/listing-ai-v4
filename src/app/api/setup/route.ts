/**
 * POST /api/setup
 * One-time setup: seeds super admin into DB from environment variable.
 * Super admin is NOT created via Clerk sign-up — they must be added here
 * by someone with server access, using their Clerk User ID.
 *
 * How it works:
 * 1. Set SUPER_ADMIN_CLERK_ID in .env.local (get from Clerk Dashboard → Users)
 * 2. Sign in to Clerk normally (as a regular user)
 * 3. Call POST /api/setup once — this seeds you as super admin in the DB
 * 4. You can now access /admin — regular users cannot
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { DEFAULT_SETTINGS } from '@/lib/settings'

export async function POST(req: NextRequest) {
  // Verify the caller is the designated super admin via env variable
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'You must be signed in to run setup.' }, { status: 401 })
  }

  const superAdminClerkId = process.env.SUPER_ADMIN_CLERK_ID
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL

  if (!superAdminClerkId) {
    return NextResponse.json({
      error: 'SUPER_ADMIN_CLERK_ID is not set in .env.local',
      instructions: [
        '1. Sign in to your app with Clerk',
        '2. Go to Clerk Dashboard → Users → click your user → copy your User ID',
        '3. Add SUPER_ADMIN_CLERK_ID=user_XXXX to your .env.local',
        '4. Restart the server and call POST /api/setup again',
      ],
    }, { status: 400 })
  }

  if (clerkId !== superAdminClerkId) {
    return NextResponse.json({
      error: 'Forbidden. Only the user matching SUPER_ADMIN_CLERK_ID can run setup.',
    }, { status: 403 })
  }

  const results: Record<string, unknown> = {}

  // ── 1. Ensure user exists in DB ──────────────────────────────────────────
  let user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId,
        email: superAdminEmail || 'admin@listingai.app',
        name: 'Super Admin',
        plan: 'super_admin',
      },
    })
    results.user = `Created user: ${user.email}`
  } else {
    await prisma.user.update({ where: { clerkId }, data: { plan: 'super_admin' } })
    results.user = `Updated user to super_admin plan: ${user.email}`
  }

  // ── 2. Seed admin user record ─────────────────────────────────────────────
  const existing = await prisma.adminUser.findFirst({ where: { clerkId } })
  if (!existing) {
    await prisma.adminUser.create({
      data: {
        clerkId,
        email: user.email,
        name: 'Super Admin',
        role: 'super_admin',
        isSuperAdmin: true,
        isActive: true,
        permissions: JSON.stringify(['*']), // all permissions
      },
    })
    results.adminUser = 'Created AdminUser record with full permissions'
  } else {
    await prisma.adminUser.update({
      where: { id: existing.id },
      data: { isSuperAdmin: true, isActive: true, role: 'super_admin', permissions: JSON.stringify(['*']) },
    })
    results.adminUser = 'Updated AdminUser to super_admin'
  }

  // ── 3. Seed super_admin_clerk_id into SiteSettings (for runtime checks) ──
  await prisma.siteSetting.upsert({
    where: { key: 'super_admin_clerk_id' },
    update: { value: clerkId },
    create: { key: 'super_admin_clerk_id', value: clerkId, label: 'Super Admin Clerk ID', group: 'admin', type: 'string' },
  })
  results.siteSetting = 'Saved super_admin_clerk_id to SiteSettings'

  // ── 4. Seed default site settings if not already seeded ──────────────────
  let settingsSeeded = 0
  for (const s of DEFAULT_SETTINGS) {
    const exists = await prisma.siteSetting.findFirst({ where: { key: s.key } })
    if (!exists) {
      await prisma.siteSetting.create({ data: s })
      settingsSeeded++
    }
  }
  results.settings = `${settingsSeeded > 0 ? `Seeded ${settingsSeeded} default settings` : 'Settings already exist'}`

  // ── 5. Seed default categories for this admin user ────────────────────────
  const catCount = await prisma.category.count({ where: { userId: user.id } })
  if (catCount === 0) {
    const { ALL_DEFAULT_CATEGORIES } = await import('@/app/api/categories/seed/route')
    await prisma.category.createMany({
      data: ALL_DEFAULT_CATEGORIES.map(c => ({ ...c, userId: user!.id, description: '' })),
    })
    results.categories = `Seeded ${ALL_DEFAULT_CATEGORIES.length} default categories`
  } else {
    results.categories = `${catCount} categories already exist`
  }

  return NextResponse.json({
    success: true,
    message: '✅ Setup complete! You are now the Super Admin.',
    results,
    nextSteps: [
      'Go to /admin to access the Super Admin panel',
      'Go to /admin/settings to configure SMTP, Analytics, integrations',
      'Go to /dashboard to start using the app',
    ],
  })
}

// GET — check setup status
export async function GET() {
  const { userId: clerkId } = await auth()
  const superAdminClerkId = process.env.SUPER_ADMIN_CLERK_ID

  const adminExists = superAdminClerkId
    ? await prisma.adminUser.findFirst({ where: { clerkId: superAdminClerkId, isSuperAdmin: true } })
    : null

  const settingsCount = await prisma.siteSetting.count()
  const usersCount = await prisma.user.count()

  return NextResponse.json({
    setupComplete: !!adminExists,
    superAdminConfigured: !!superAdminClerkId,
    currentUserIsSuperAdmin: clerkId === superAdminClerkId,
    stats: { users: usersCount, settings: settingsCount },
    instructions: !superAdminClerkId ? [
      '1. Sign in to Clerk',
      '2. Get your Clerk User ID from Clerk Dashboard → Users',
      '3. Add SUPER_ADMIN_CLERK_ID=user_XXXX to .env.local',
      '4. Restart server and call POST /api/setup',
    ] : adminExists ? ['Setup already complete. Go to /admin'] : ['Call POST /api/setup while signed in as the super admin'],
  })
}
