import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { delCachePattern } from '@/lib/redis'

async function getProduct(clerkId: string, productId: number) {
  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return null
  const product = await prisma.product.findFirst({ where: { id: productId, userId: user.id } })
  return { user, product }
}

// GET /api/products/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const res = await getProduct(clerkId, parseInt(params.id))
  if (!res?.product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(res.product)
}

// PUT /api/products/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const res = await getProduct(clerkId, parseInt(params.id))
  if (!res?.product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  const updated = await prisma.product.update({
    where: { id: res.product.id },
    data: { ...body, price: body.price != null ? parseFloat(body.price) : undefined, comparePrice: body.comparePrice != null ? parseFloat(body.comparePrice) : undefined, updatedAt: new Date() },
  })
  await delCachePattern(`products:${res.user.id}:*`)
  return NextResponse.json({ success: true, product: updated })
}

// PATCH /api/products/[id] — partial update (e.g. status)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const res = await getProduct(clerkId, parseInt(params.id))
  if (!res?.product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  const updated = await prisma.product.update({ where: { id: res.product.id }, data: { ...body, updatedAt: new Date() } })
  await delCachePattern(`products:${res.user.id}:*`)
  return NextResponse.json({ success: true, product: updated })
}

// DELETE /api/products/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const res = await getProduct(clerkId, parseInt(params.id))
  if (!res?.product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.product.delete({ where: { id: res.product.id } })
  await delCachePattern(`products:${res.user.id}:*`)
  return NextResponse.json({ success: true })
}
