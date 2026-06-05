import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/redis'

// 30+ comprehensive default categories covering all ecommerce verticals
export const ALL_DEFAULT_CATEGORIES = [
  // ── Tier 1: Core ecommerce ──────────────────────────────────────────────
  { name:'General',              slug:'general',        icon:'📦', color:'#6366f1', tone:'professional', promptHint:'', sortOrder:0 },
  { name:'Electronics',          slug:'electronics',    icon:'💻', color:'#3b82f6', tone:'technical',    promptHint:'Focus on specs (processor, RAM, storage, battery), compatibility, warranty, connectivity ports.', sortOrder:1 },
  { name:'Clothing & Fashion',   slug:'clothing',       icon:'👕', color:'#a78bfa', tone:'friendly',     promptHint:'Focus on fabric composition, fit type (slim/regular/oversized), care instructions, occasions, size range.', sortOrder:2 },
  { name:'Beauty & Skincare',    slug:'beauty',         icon:'💄', color:'#f472b6', tone:'luxury',       promptHint:'Focus on key ingredients, skin type suitability, results timeline, cruelty-free/vegan certification.', sortOrder:3 },
  { name:'Home & Living',        slug:'home',           icon:'🏠', color:'#22d3ee', tone:'professional', promptHint:'Focus on dimensions, materials, assembly complexity, room suitability, style (modern/rustic/minimal).', sortOrder:4 },
  { name:'Sports & Outdoor',     slug:'sports',         icon:'🏃', color:'#22c55e', tone:'technical',    promptHint:'Focus on performance features, moisture-wicking properties, safety certifications, weight, size chart.', sortOrder:5 },
  { name:'Food & Grocery',       slug:'food',           icon:'🍎', color:'#f59e0b', tone:'friendly',     promptHint:'Focus on ingredients, allergen info, dietary tags (vegan/keto/gluten-free), nutritional highlights, shelf life.', sortOrder:6 },
  { name:'Toys & Kids',          slug:'toys',           icon:'🧸', color:'#fb923c', tone:'friendly',     promptHint:'Focus on age range, safety certifications (CE/ASTM/EN71), educational value, BPA-free materials, assembly.', sortOrder:7 },
  { name:'Tools & Hardware',     slug:'tools',          icon:'🔨', color:'#64748b', tone:'technical',    promptHint:'Focus on power/torque specs, material compatibility, safety features, warranty, professional vs DIY.', sortOrder:8 },
  { name:'Automotive',           slug:'auto',           icon:'🚗', color:'#ef4444', tone:'technical',    promptHint:'Focus on vehicle year/make/model compatibility, installation difficulty, OEM vs aftermarket, certifications.', sortOrder:9 },
  // ── Tier 2: Lifestyle & culture ─────────────────────────────────────────
  { name:'Books & Media',        slug:'books',          icon:'📚', color:'#8b5cf6', tone:'professional', promptHint:'Focus on author, genre, page count, reading level, educational value, target audience, ISBN.', sortOrder:10 },
  { name:'Health & Wellness',    slug:'health',         icon:'💊', color:'#10b981', tone:'technical',    promptHint:'Focus on active ingredients, dosage, certifications, who it is for, clinical backing, dietary compatibility.', sortOrder:11 },
  { name:'Jewelry & Accessories',slug:'jewelry',        icon:'💍', color:'#fbbf24', tone:'luxury',       promptHint:'Focus on metal purity (14k/18k/925 silver), gemstone type, weight, dimensions, occasion, packaging.', sortOrder:12 },
  { name:'Pet Supplies',         slug:'pets',           icon:'🐾', color:'#84cc16', tone:'friendly',     promptHint:'Focus on breed/weight suitability, safety certifications, non-toxic materials, dimensions, washing instructions.', sortOrder:13 },
  { name:'Office & Stationery',  slug:'office',         icon:'🖥️', color:'#6b7280', tone:'professional', promptHint:'Focus on compatibility, dimensions, ergonomic features, connectivity, power consumption, warranty.', sortOrder:14 },
  { name:'Gaming',               slug:'gaming',         icon:'🎮', color:'#7c3aed', tone:'technical',    promptHint:'Focus on platform compatibility, resolution, frame rate, connectivity, response time, accessories included.', sortOrder:15 },
  { name:'Photography',          slug:'photography',    icon:'📷', color:'#0ea5e9', tone:'technical',    promptHint:'Focus on sensor specs, megapixels, lens compatibility, video capabilities, battery life, weatherproofing.', sortOrder:16 },
  { name:'Garden & Outdoor',     slug:'garden',         icon:'🌱', color:'#16a34a', tone:'friendly',     promptHint:'Focus on plant suitability, weather/UV resistance, dimensions, materials, low-maintenance features.', sortOrder:17 },
  { name:'Music & Audio',        slug:'music',          icon:'🎵', color:'#db2777', tone:'technical',    promptHint:'Focus on frequency response, driver size, connectivity (Bluetooth/wired), battery life, noise cancellation.', sortOrder:18 },
  { name:'Travel & Luggage',     slug:'travel',         icon:'✈️', color:'#0284c7', tone:'friendly',     promptHint:'Focus on dimensions (airline compliance), weight, material durability, wheels/handles, TSA lock, warranty.', sortOrder:19 },
  // ── Tier 3: Speciality verticals ────────────────────────────────────────
  { name:'Baby & Maternity',     slug:'baby',           icon:'👶', color:'#fb7185', tone:'friendly',     promptHint:'Focus on safety certifications, age appropriateness, BPA-free/non-toxic, washability, developmental benefits.', sortOrder:20 },
  { name:'Footwear',             slug:'footwear',       icon:'👟', color:'#f97316', tone:'friendly',     promptHint:'Focus on material, sole type, occasion, size/width range, waterproofing, arch support, care instructions.', sortOrder:21 },
  { name:'Bags & Handbags',      slug:'bags',           icon:'👜', color:'#ec4899', tone:'luxury',       promptHint:'Focus on material (leather/canvas), dimensions (L×W×H), strap type, closure, compartments, occasion.', sortOrder:22 },
  { name:'Watches',              slug:'watches',        icon:'⌚', color:'#78716c', tone:'luxury',       promptHint:'Focus on movement type (quartz/automatic), water resistance (ATM), case diameter, strap material, features.', sortOrder:23 },
  { name:'Furniture',            slug:'furniture',      icon:'🛋️', color:'#854d0e', tone:'professional', promptHint:'Focus on dimensions, weight capacity, assembly required, materials, style, room recommendations.', sortOrder:24 },
  { name:'Supplements & Vitamins',slug:'supplements',   icon:'💪', color:'#15803d', tone:'technical',    promptHint:'Focus on active ingredients, dosage form, certifications (GMP/NSF), allergens, who benefits most.', sortOrder:25 },
  { name:'Art & Craft',          slug:'art',            icon:'🎨', color:'#d97706', tone:'friendly',     promptHint:'Focus on medium, suitable age/skill level, materials included, finished size, educational value.', sortOrder:26 },
  { name:'Industrial & Scientific',slug:'industrial',   icon:'⚙️', color:'#475569', tone:'technical',   promptHint:'Focus on material grade, tolerance specs, certifications, operating temperature, application use cases.', sortOrder:27 },
  { name:'Smart Home',           slug:'smart-home',     icon:'🏡', color:'#0891b2', tone:'technical',    promptHint:'Focus on protocol (Zigbee/Z-Wave/WiFi/BT), voice assistant compatibility, power requirements, installation.', sortOrder:28 },
  { name:'Bedding & Bath',       slug:'bedding',        icon:'🛏️', color:'#7dd3fc', tone:'professional', promptHint:'Focus on thread count, material (cotton/bamboo/microfiber), dimensions, care instructions, hypoallergenic.', sortOrder:29 },
  { name:'Kitchen & Dining',     slug:'kitchen',        icon:'🍳', color:'#fca5a5', tone:'friendly',     promptHint:'Focus on material (stainless/non-stick/ceramic), capacity, dishwasher-safe, oven-safe temp, dimensions.', sortOrder:30 },
  { name:'Lighting',             slug:'lighting',       icon:'💡', color:'#fde68a', tone:'professional', promptHint:'Focus on wattage, lumens, colour temperature (K), fitting type, dimmable, energy rating, lifespan (hours).', sortOrder:31 },
  { name:'Phone Accessories',    slug:'phone-accessories',icon:'📱', color:'#818cf8', tone:'technical', promptHint:'Focus on compatibility (model/brand), material, protection rating (MIL-STD), wireless charging, colour options.', sortOrder:32 },
  { name:'Computer Accessories', slug:'computer-accessories',icon:'🖱️', color:'#38bdf8', tone:'technical', promptHint:'Focus on compatibility (OS/interface), DPI/polling rate, connectivity, dimensions, cable length.', sortOrder:33 },
  { name:'Cleaning & Hygiene',   slug:'cleaning',       icon:'🧹', color:'#6ee7b7', tone:'professional', promptHint:'Focus on surface compatibility, ingredients, concentration, eco-friendly certifications, fragrance.', sortOrder:34 },
]

// GET — list all available default categories (public)
export async function GET() {
  return NextResponse.json({ categories: ALL_DEFAULT_CATEGORIES, total: ALL_DEFAULT_CATEGORIES.length })
}

// POST — seed default categories for a user
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Rate limit: max 5 seed calls per user per hour
  const allowed = await checkRateLimit(`seed:${user.id}`, 5, 3600)
  if (!allowed) return NextResponse.json({ error: 'Rate limit: max 5 seed calls per hour' }, { status: 429 })

  const body = await req.json().catch(() => ({}))
  const slugs: string[] = body.slugs || ALL_DEFAULT_CATEGORIES.map(c => c.slug)

  const toSeed = ALL_DEFAULT_CATEGORIES.filter(c => slugs.includes(c.slug))
  let added = 0, skipped = 0

  for (const cat of toSeed) {
    const exists = await prisma.category.findFirst({ where: { userId: user.id, slug: cat.slug } })
    if (exists) { skipped++; continue }
    await prisma.category.create({ data: { ...cat, userId: user.id, description: '' } })
    added++
  }

  return NextResponse.json({ success: true, added, skipped, total: toSeed.length })
}
