import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, contactReplyTemplate } from '@/lib/email'

// PATCH /api/contact/[id] — admin: mark read, reply
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const msg = await prisma.contactMessage.findUnique({ where: { id: parseInt(params.id) } })
  if (!msg) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { action, reply, status } = body

  if (action === 'reply' && reply?.trim()) {
    // Send reply email
    const sent = await sendEmail({
      to: msg.email,
      subject: `Re: ${msg.subject}`,
      html: contactReplyTemplate(msg.name, msg.message, reply.trim()),
      replyTo: 'support@listingai.app',
    })

    await prisma.contactMessage.update({
      where: { id: msg.id },
      data: {
        reply: reply.trim(),
        repliedAt: new Date(),
        repliedBy: clerkId,
        status: 'replied',
      },
    })

    return NextResponse.json({ success: true, emailSent: sent.success, error: sent.error })
  }

  if (status) {
    await prisma.contactMessage.update({ where: { id: msg.id }, data: { status } })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'No action specified' }, { status: 400 })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.contactMessage.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ success: true })
}
