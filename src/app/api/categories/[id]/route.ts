import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { delCachePattern } from '@/lib/redis'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  const cat = await prisma.category.findFirst({ where: { id: parseInt(params.id), userId: user.id } })
  if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const updated = await prisma.category.update({ where: { id: cat.id }, data: body })
  await delCachePattern(`categories:${user.id}`)
  return NextResponse.json({ success: true, category: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.category.deleteMany({ where: { id: parseInt(params.id), userId: user.id } })
  await delCachePattern(`categories:${user.id}`)
  return NextResponse.json({ success: true })
}
