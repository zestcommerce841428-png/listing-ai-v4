/**
 * ListingAI — Universal AI Engine
 * Supports: Groq, Gemini, OpenAI, AWS Bedrock, Ollama
 */

export interface AIOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  tone?: string
  category?: string
}

export interface AICredentials {
  provider: string
  apiKey: string
}

const DEFAULT_SYSTEM = 'You are an expert ecommerce copywriter specializing in product listings that rank high on search engines and convert browsers into buyers. Always respond with clean, professional copy.'

const CAT_HINTS: Record<string, string> = {
  electronics: 'Focus on: specifications (RAM, storage, processor, battery), compatibility, warranty, technical accuracy.',
  clothing: 'Focus on: fabric composition, fit (slim/regular/oversized), care instructions, sizing, occasions.',
  beauty: 'Focus on: key ingredients, skin type suitability, results, certifications (cruelty-free, dermatologist tested).',
  home: 'Focus on: dimensions, materials, assembly required, room suitability, style, durability.',
  sports: 'Focus on: performance features, materials, moisture-wicking, safety certifications, weight.',
  food: 'Focus on: ingredients, allergen info, nutritional highlights, dietary tags (vegan/keto/gluten-free), shelf life.',
  toys: 'Focus on: age range, safety certifications (CE/ASTM), educational value, BPA-free materials.',
  tools: 'Focus on: power/torque specs, compatible materials, safety features, warranty, professional vs DIY.',
  auto: 'Focus on: vehicle compatibility (year/make/model), installation complexity, OEM vs aftermarket.',
  health: 'Focus on: active ingredients, dosage, certifications, who it is for.',
  jewelry: 'Focus on: material purity, weight, dimensions, packaging, occasion.',
  pets: 'Focus on: breed suitability, safety, materials, size chart.',
  office: 'Focus on: compatibility, dimensions, ergonomics, warranty.',
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  professional: 'Use formal, authoritative, precise language. Be factual and informative.',
  friendly: 'Use warm, conversational language. Use "you" frequently. Be enthusiastic but genuine.',
  luxury: 'Use premium, aspirational language. Emphasize exclusivity, craftsmanship, and prestige.',
  budget: 'Emphasize value for money, savings, and affordability. Use "affordable", "best value", "great deal".',
  technical: 'Use precise technical specifications and industry terminology. Target expert buyers.',
  urgent: 'Create urgency with "Limited stock", "Best seller", "Trending now". Drive immediate action.',
}

export function buildPrompt(product: Record<string, string>, platform: string, opts: AIOptions = {}): string {
  const tone = opts.tone || 'professional'
  const cat = (opts.category || product.category || 'general').toLowerCase()
  const catHint = CAT_HINTS[cat] || ''
  const toneInst = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.professional

  const platformSpec = platform === 'amazon'
    ? `Amazon listing: "title" (keyword-rich, max 200 chars), "bullet_points" (array of 5, each starting with ALL-CAPS benefit word), "description" (500-800 chars plain text), "seo_keywords" (comma-separated, max 250 chars), "meta_description" (160 chars)`
    : `Shopify listing: "title" (SEO optimised, max 70 chars, primary keyword first), "bullet_points" (array of 5 feature highlights), "description" (rich HTML with <p><ul><li><strong> tags, 200-400 words), "seo_keywords" (8-15 keywords comma-separated), "meta_description" (compelling 120-160 char description)`

  return `${toneInst}
${catHint ? '\nCategory guidance: ' + catHint : ''}

Write a complete ${platformSpec}

Product: ${product.productName || product.title || ''}
Category: ${cat}
Price: ${product.price ? '$' + product.price : 'not specified'}
Keywords to include: ${product.keywords || product.seo_keywords || 'none specified'}
${product.extraInfo || product.description ? 'Additional details: ' + (product.extraInfo || product.description || '').slice(0, 400) : ''}

IMPORTANT: Respond ONLY with valid JSON. No markdown code blocks, no explanation. Use this exact schema:
{"title":"...","bullet_points":["...","...","...","...","..."],"description":"...","seo_keywords":"...","meta_description":"..."}`
}

export async function callAI(credentials: AICredentials, prompt: string, opts: AIOptions = {}): Promise<string> {
  const { provider, apiKey } = credentials
  const temp = opts.temperature ?? 0.7
  const maxTok = opts.maxTokens ?? 1000
  const sys = opts.systemPrompt || DEFAULT_SYSTEM

  switch (provider) {
    case 'groq': {
      const Groq = (await import('groq-sdk')).default
      const groq = new Groq({ apiKey })
      const r = await groq.chat.completions.create({
        model: opts.model || 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: sys }, { role: 'user', content: prompt }],
        temperature: temp,
        max_tokens: maxTok,
      })
      return r.choices[0].message.content?.trim() || ''
    }

    case 'gemini': {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(apiKey)
      const mdl = genAI.getGenerativeModel({
        model: opts.model || 'gemini-2.0-flash',
        systemInstruction: sys,
        generationConfig: { temperature: temp, maxOutputTokens: maxTok },
      })
      const result = await mdl.generateContent(prompt)
      return result.response.text().trim()
    }

    case 'openai': {
      const OpenAI = (await import('openai')).default
      const openai = new OpenAI({ apiKey })
      const r = await openai.chat.completions.create({
        model: opts.model || 'gpt-3.5-turbo',
        messages: [{ role: 'system', content: sys }, { role: 'user', content: prompt }],
        temperature: temp,
        max_tokens: maxTok,
      })
      return r.choices[0].message.content?.trim() || ''
    }

    case 'bedrock': {
      const [accessKeyId, secretAccessKey, region = 'us-east-1'] = apiKey.split('|')
      const { BedrockRuntimeClient, ConverseCommand } = await import('@aws-sdk/client-bedrock-runtime')
      const client = new BedrockRuntimeClient({ region, credentials: { accessKeyId, secretAccessKey } })
      const cmd = new ConverseCommand({
        modelId: opts.model || 'amazon.nova-lite-v1:0',
        system: [{ text: sys }],
        messages: [{ role: 'user', content: [{ text: prompt }] }],
        inferenceConfig: { maxTokens: maxTok, temperature: temp },
      })
      const resp = await client.send(cmd)
      const output = resp.output?.message?.content
      if (Array.isArray(output)) return output.map((b: { text?: string }) => b.text || '').join('').trim()
      return ''
    }

    case 'ollama': {
      const modelName = opts.model || apiKey || 'gemma2:2b'
      const r = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          stream: false,
          options: { temperature: temp, num_predict: maxTok },
          messages: [{ role: 'system', content: sys }, { role: 'user', content: prompt }],
        }),
      })
      const d = await r.json()
      return (d.message?.content || d.response || '').trim()
    }

    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

export function extractJSON(raw: string): Record<string, unknown> {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found in AI response. Raw: ' + raw.slice(0, 200))
  return JSON.parse(match[0])
}

export interface SEOResult {
  score: number
  grade: 'A' | 'B' | 'C' | 'D'
  issues: string[]
  tips: string[]
}

export function scoreListing(content: Record<string, unknown>, platform: string): SEOResult {
  let score = 0
  const issues: string[] = []
  const tips: string[] = []

  const title = (content.title as string) || ''
  const desc = (content.description as string) || ''
  const kw = (content.seo_keywords as string) || ''
  const meta = (content.meta_description as string) || ''
  const bullets = (content.bullet_points as string[]) || []

  if (title.length >= 30) { score += 20 } else { issues.push('Title too short (< 30 chars)'); tips.push('Write a more descriptive title') }
  if (platform === 'amazon' && title.length > 200) { issues.push('Amazon title exceeds 200 chars'); score -= 10 }
  if (platform === 'shopify' && title.length > 70) { issues.push('Shopify title exceeds 70 chars'); score -= 5 }

  if (bullets.length >= 5) { score += 20 } else { issues.push(`Only ${bullets.length}/5 bullet points`) }
  if (bullets.every(b => b.length > 20)) { score += 10 } else { tips.push('Make bullet points more detailed') }

  if (desc.length >= 200) { score += 20 } else { issues.push('Description too short'); tips.push('Write at least 200 characters') }

  const kwCount = kw.split(',').filter(k => k.trim()).length
  if (kwCount >= 5) { score += 15 } else { issues.push(`Only ${kwCount} keywords (need 5+)`); tips.push('Add more relevant keywords') }

  if (meta.length >= 50 && meta.length <= 160) { score += 15 } else { issues.push('Meta description wrong length (50-160 chars)') }

  score = Math.max(0, Math.min(100, score))
  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'D'
  return { score, grade, issues, tips }
}

export const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (best quality)', free: true },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (fastest)', free: true },
  { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (balanced)', free: true },
  { id: 'gemma2-9b-it', label: 'Gemma2 9B (Google)', free: true },
]

export const GEMINI_MODELS = [
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (recommended)', free: true },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (stable)', free: true },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (high quality)', free: false },
]

export const OPENAI_MODELS = [
  { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (cheap & fast)', free: false },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini (better quality)', free: false },
  { id: 'gpt-4o', label: 'GPT-4o (best quality)', free: false },
]

export const BEDROCK_MODELS = [
  { id: 'anthropic.claude-3-5-sonnet-20241022-v2:0', label: 'Claude 3.5 Sonnet v2 (best)', family: 'claude', free: false },
  { id: 'anthropic.claude-3-5-haiku-20241022-v1:0', label: 'Claude 3.5 Haiku (fast)', family: 'claude', free: false },
  { id: 'anthropic.claude-3-haiku-20240307-v1:0', label: 'Claude 3 Haiku (cheapest)', family: 'claude', free: false },
  { id: 'meta.llama3-3-70b-instruct-v1:0', label: 'Llama 3.3 70B (latest)', family: 'llama', free: false },
  { id: 'meta.llama3-2-3b-instruct-v1:0', label: 'Llama 3.2 3B (cheapest)', family: 'llama', free: false },
  { id: 'amazon.nova-micro-v1:0', label: 'Amazon Nova Micro (cheapest all)', family: 'nova', free: false },
  { id: 'amazon.nova-lite-v1:0', label: 'Amazon Nova Lite (fast)', family: 'nova', free: false },
  { id: 'amazon.nova-pro-v1:0', label: 'Amazon Nova Pro (best Nova)', family: 'nova', free: false },
  { id: 'mistral.mistral-small-2402-v1:0', label: 'Mistral Small', family: 'mistral', free: false },
  { id: 'mistral.mistral-large-2402-v1:0', label: 'Mistral Large', family: 'mistral', free: false },
  { id: 'cohere.command-r-plus-v1:0', label: 'Cohere Command R+', family: 'cohere', free: false },
  { id: 'amazon.titan-text-express-v1', label: 'Titan Text Express', family: 'titan', free: false },
]
