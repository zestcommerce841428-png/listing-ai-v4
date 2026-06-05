import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

type Props = { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug }, include: { category: true } })
  if (!post) return { title: 'Post Not Found' }
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: 'article', publishedTime: post.publishedAt?.toISOString() },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug, status: 'published' },
    include: { category: true },
  })
  if (!post) notFound()

  // Get related posts
  const related = await prisma.blogPost.findMany({
    where: { status: 'published', categoryId: post.categoryId, NOT: { id: post.id } },
    take: 3,
    orderBy: { publishedAt: 'desc' },
    select: { title: true, slug: true, excerpt: true, readTime: true, category: true },
  })

  // Increment views
  prisma.blogPost.update({ where: { id: post.id }, data: { views: { increment: 1 } } }).catch(() => {})

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xs">LA</div>
          <span className="font-bold">ListingAI</span>
        </Link>
        <div className="flex gap-4 text-sm">
          <Link href="/blog" className="text-gray-400 hover:text-white">← Blog</Link>
          <Link href="/dashboard" className="bg-indigo-500 text-white px-3 py-1.5 rounded-lg">Dashboard</Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-16">
        {/* Category + meta */}
        <div className="flex items-center gap-3 mb-6">
          {post.category && (
            <Link href={`/blog?category=${post.category.slug}`} className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full hover:bg-indigo-500/20 transition-colors">
              {post.category.icon} {post.category.name}
            </Link>
          )}
          <span className="text-xs text-gray-500">{post.readTime} min read</span>
          <span className="text-xs text-gray-500">{post.views} views</span>
        </div>

        <h1 className="text-4xl font-black mb-6 leading-tight">{post.title}</h1>
        <p className="text-xl text-gray-400 mb-8 leading-relaxed">{post.excerpt}</p>

        <div className="flex items-center gap-3 mb-10 pb-8 border-b border-gray-800">
          <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-sm">{post.authorName[0]}</div>
          <div>
            <div className="font-semibold text-white text-sm">{post.authorName}</div>
            <div className="text-xs text-gray-500">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</div>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none" dangerouslySetInnerHTML={{
          __html: post.content
            .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-white mt-8 mb-3">$1</h3>')
            .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-white mt-10 mb-4">$1</h2>')
            .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1 text-gray-300">$1</li>')
            .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
            .replace(/\n\n/g, '</p><p class="text-gray-300 leading-relaxed mb-4">')
            .replace(/^(?!<[h|l])(.+)$/gm, (line: string) => `<p class="text-gray-300 leading-relaxed mb-4">${line}</p>`)
        }} />

        {/* Tags */}
        {post.tags && (
          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="flex flex-wrap gap-2">
              {post.tags.split(',').map((tag: string) => (
                <Link key={tag} href={`/blog?q=${tag.trim()}`} className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full hover:bg-gray-700 hover:text-white transition-colors">
                  #{tag.trim()}
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12 border-t border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-8">Related Articles</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {related.map((p: { slug: string; title: string; excerpt: string; readTime: number; category: { name: string } | null }) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-indigo-500/50 transition-colors block">
                <div className="text-xs text-indigo-400 mb-2">{p.category?.name}</div>
                <h3 className="font-bold text-white mb-2 line-clamp-2">{p.title}</h3>
                <p className="text-gray-400 text-sm line-clamp-2">{p.excerpt}</p>
                <div className="text-xs text-gray-500 mt-3">{p.readTime} min read</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-indigo-500/10 border-y border-indigo-500/20 py-16 text-center">
        <h2 className="text-3xl font-black mb-3">Start automating your listings</h2>
        <p className="text-gray-400 mb-8">Generate 500+ product listings in 20 minutes. Free with Groq & Gemini AI.</p>
        <Link href="/dashboard" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-8 py-4 rounded-xl transition-colors inline-block">Open Dashboard →</Link>
      </section>

      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        <Link href="/blog" className="hover:text-gray-300">← Back to Blog</Link>
      </footer>
    </div>
  )
}
