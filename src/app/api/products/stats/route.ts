import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const [total, byStatus] = await Promise.all([
      prisma.product.count({ where: { userId: user.id } }),
      prisma.product.groupBy({ by: ['status'], where: { userId: user.id }, _count: true }),
    ])

    return NextResponse.json({ total, byStatus, userId: user.id })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
