import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { callAI } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { provider, apiKey, model } = await req.json()
    const result = await callAI({ provider, apiKey }, 'Say "OK" and nothing else.', { model, maxTokens: 15 })
    return NextResponse.json({ success: true, response: result.slice(0, 80) })
  } catch (e: unknown) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}
