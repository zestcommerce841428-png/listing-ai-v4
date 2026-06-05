import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) {
    const clerkUser = await currentUser()
    user = await prisma.user.create({
      data: {
        clerkId,
        email: clerkUser?.emailAddresses[0]?.emailAddress || '',
        name: `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim(),
      },
    })
    // Seed 20 default categories — unlimited more can be created
    const defaultCats = [
      { name:'General',         slug:'general',       icon:'📦', color:'#6366f1', tone:'professional', promptHint:'', sortOrder:0 },
      { name:'Electronics',     slug:'electronics',   icon:'💻', color:'#3b82f6', tone:'technical',    promptHint:'Focus on specs, battery life, compatibility, warranty, processor, RAM, storage.', sortOrder:1 },
      { name:'Clothing',        slug:'clothing',      icon:'👕', color:'#a78bfa', tone:'friendly',     promptHint:'Focus on fabric composition, fit (slim/regular/oversized), care instructions, occasions.', sortOrder:2 },
      { name:'Beauty',          slug:'beauty',        icon:'💄', color:'#f472b6', tone:'luxury',       promptHint:'Focus on key ingredients, skin type suitability, results, cruelty-free/vegan certifications.', sortOrder:3 },
      { name:'Home & Living',   slug:'home',          icon:'🏠', color:'#22d3ee', tone:'professional', promptHint:'Focus on dimensions, materials, assembly required, room suitability, style.', sortOrder:4 },
      { name:'Sports & Outdoor',slug:'sports',        icon:'🏃', color:'#22c55e', tone:'technical',    promptHint:'Focus on performance features, moisture-wicking, safety certifications, size charts.', sortOrder:5 },
      { name:'Food & Grocery',  slug:'food',          icon:'🍎', color:'#f59e0b', tone:'friendly',     promptHint:'Focus on ingredients, allergens, dietary tags (vegan/keto/gluten-free), shelf life, nutrition.', sortOrder:6 },
      { name:'Toys & Kids',     slug:'toys',          icon:'🧸', color:'#fb923c', tone:'friendly',     promptHint:'Focus on age range, safety certifications (CE/ASTM), educational value, BPA-free.', sortOrder:7 },
      { name:'Tools & Hardware',slug:'tools',         icon:'🔨', color:'#64748b', tone:'technical',    promptHint:'Focus on power/torque specs, materials, safety features, warranty, DIY vs professional.', sortOrder:8 },
      { name:'Automotive',      slug:'auto',          icon:'🚗', color:'#ef4444', tone:'technical',    promptHint:'Focus on vehicle compatibility (year/make/model), installation complexity, OEM vs aftermarket.', sortOrder:9 },
      { name:'Books',           slug:'books',         icon:'📚', color:'#8b5cf6', tone:'professional', promptHint:'Focus on author, genre, page count, educational value, target audience, reading level.', sortOrder:10 },
      { name:'Health & Wellness',slug:'health',       icon:'💊', color:'#10b981', tone:'technical',    promptHint:'Focus on active ingredients, dosage, certifications, who it is for, clinical studies.', sortOrder:11 },
      { name:'Jewelry',         slug:'jewelry',       icon:'💍', color:'#fbbf24', tone:'luxury',       promptHint:'Focus on metal purity, gemstone type, weight, dimensions, occasion, packaging.', sortOrder:12 },
      { name:'Pet Supplies',    slug:'pets',          icon:'🐾', color:'#84cc16', tone:'friendly',     promptHint:'Focus on breed/size suitability, safety certifications, materials, dimensions.', sortOrder:13 },
      { name:'Office & Stationery',slug:'office',     icon:'🖥️', color:'#6b7280', tone:'professional', promptHint:'Focus on compatibility, dimensions, ergonomics, connectivity, warranty.', sortOrder:14 },
      { name:'Gaming',          slug:'gaming',        icon:'🎮', color:'#7c3aed', tone:'technical',    promptHint:'Focus on platform compatibility, resolution, frame rate, connectivity, accessories included.', sortOrder:15 },
      { name:'Photography',     slug:'photography',   icon:'📷', color:'#0ea5e9', tone:'technical',    promptHint:'Focus on sensor size, megapixels, lens compatibility, video specs, battery life.', sortOrder:16 },
      { name:'Garden & Outdoor',slug:'garden',        icon:'🌱', color:'#16a34a', tone:'friendly',     promptHint:'Focus on plant type suitability, weather resistance, dimensions, materials, maintenance.', sortOrder:17 },
      { name:'Music & Audio',   slug:'music',         icon:'🎵', color:'#db2777', tone:'technical',    promptHint:'Focus on frequency response, impedance, connectivity, compatibility, warranty.', sortOrder:18 },
      { name:'Travel & Luggage',slug:'travel',        icon:'✈️', color:'#0284c7', tone:'friendly',     promptHint:'Focus on dimensions, weight, material, wheels/handles, TSA compliance, warranty.', sortOrder:19 },
    ]
    await prisma.category.createMany({ data: defaultCats.map(c => ({ ...c, userId: user!.id, description: '' })) })
  }

  return NextResponse.json({ user })
}

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { clerkId } })
  return NextResponse.json({ user })
}
