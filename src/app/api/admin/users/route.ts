import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

async function isAdmin(clerkId: string) {
  const sa = await prisma.siteSetting.findFirst({ where: { key: 'super_admin_clerk_id' } })
  if (sa?.value === clerkId) return true
  return !!(await prisma.adminUser.findFirst({ where: { clerkId, isActive: true } }))
}

// GET /api/admin/users — list all users
export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId || !(await isAdmin(clerkId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const q = searchParams.get('q') || ''
  const skip = (page - 1) * limit

  const where = q ? { OR: [{ email: { contains: q } }, { name: { contains: q } }] } : {}
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit,
      include: { _count: { select: { products: true, queueItems: true } } } }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) })
}

// PATCH /api/admin/users — ban/unban, update plan
export async function PATCH(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId || !(await isAdmin(clerkId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, action, plan } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  if (action === 'ban') {
    await prisma.user.update({ where: { id: userId }, data: { plan: 'banned' } })
    return NextResponse.json({ success: true, action: 'banned' })
  }
  if (action === 'unban') {
    await prisma.user.update({ where: { id: userId }, data: { plan: 'free' } })
    return NextResponse.json({ success: true, action: 'unbanned' })
  }
  if (action === 'set_plan' && plan) {
    await prisma.user.update({ where: { id: userId }, data: { plan } })
    return NextResponse.json({ success: true, plan })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

// DELETE /api/admin/users — delete user + all their data
export async function DELETE(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId || !(await isAdmin(clerkId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  await prisma.user.delete({ where: { id: userId } })
  return NextResponse.json({ success: true })
}
