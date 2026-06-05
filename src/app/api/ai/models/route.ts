import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { callAI, GROQ_MODELS, GEMINI_MODELS, OPENAI_MODELS, BEDROCK_MODELS } from '@/lib/ai'
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const provider = searchParams.get('provider') || 'groq'

  if (provider === 'groq') return NextResponse.json({ models: GROQ_MODELS })
  if (provider === 'gemini') return NextResponse.json({ models: GEMINI_MODELS })
  if (provider === 'openai') return NextResponse.json({ models: OPENAI_MODELS })
  if (provider === 'bedrock') return NextResponse.json({ models: BEDROCK_MODELS, families: ['claude','llama','mistral','nova','titan','cohere','ai21'] })

  if (provider === 'ollama') {
    try {
      const r = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(5000) })
      const d = await r.json()
      const models = (d.models || []).map((m: { name: string; details?: { parameter_size?: string } }) => ({
        id: m.name, label: `${m.name} (${m.details?.parameter_size || '?'})`, free: true,
      }))
      return NextResponse.json({ models: models.length ? models : [{ id: 'gemma2:2b', label: 'gemma2:2b', free: true }] })
    } catch {
      return NextResponse.json({ models: [{ id: 'gemma2:2b', label: 'gemma2:2b', free: true }, { id: 'llama3.2:3b', label: 'llama3.2:3b', free: true }] })
    }
  }

  return NextResponse.json({ models: [...GROQ_MODELS, ...GEMINI_MODELS, ...OPENAI_MODELS] })
}

// POST /api/ai/models — live Bedrock catalogue
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { accessKeyId, secretAccessKey, region = 'us-east-1' } = await req.json()
  if (!accessKeyId || !secretAccessKey) return NextResponse.json({ models: BEDROCK_MODELS, source: 'static' })

  try {
    const client = new BedrockClient({ region, credentials: { accessKeyId, secretAccessKey } })
    const resp = await client.send(new ListFoundationModelsCommand({ byOutputModality: 'TEXT' }))
    const models = (resp.modelSummaries || [])
      .filter(m => m.inferenceTypesSupported?.includes('ON_DEMAND'))
      .map(m => ({ id: m.modelId, label: `${m.modelName} (${m.providerName})`, family: m.providerName?.toLowerCase().replace(/\s+/g, ''), free: false }))
    return NextResponse.json({ models: models.length ? models : BEDROCK_MODELS, source: 'live', region })
  } catch (e: unknown) {
    return NextResponse.json({ models: BEDROCK_MODELS, source: 'static', error: e instanceof Error ? e.message : String(e) })
  }
}
