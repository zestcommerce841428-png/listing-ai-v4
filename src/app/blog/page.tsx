import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog — Ecommerce & AI Listing Tips',
  description: 'Expert guides on ecommerce listing optimization, AI content generation, Amazon SEO, Shopify tips, and selling strategies.',
  keywords: ['ecommerce blog', 'product listing tips', 'Amazon SEO', 'Shopify tips', 'AI ecommerce'],
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xs">LA</div>
          <span className="font-bold">ListingAI</span>
        </Link>
        <div className="flex gap-4 text-sm text-gray-400">
          <Link href="/blog" className="text-white font-semibold">Blog</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
          <Link href="/dashboard" className="bg-indigo-500 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition-colors">Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black mb-4">ListingAI Blog</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">Expert guides on ecommerce optimization, AI content generation, and selling strategies.</p>
          <div className="flex gap-2 justify-center mt-6 flex-wrap" id="category-filters">
            {['All','Amazon','Shopify','AI Tools','SEO','Product Listings','Strategy'].map(cat => (
              <button key={cat} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${cat==='All'?'bg-indigo-500 text-white':'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-10">
          <input type="text" placeholder="Search articles…" className="w-full max-w-md mx-auto block bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none placeholder-gray-500"/>
        </div>

        {/* Blog posts grid — loaded client-side */}
        <div id="blog-grid" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Loading skeleton */}
          {Array.from({length:6}).map((_,i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-800"></div>
              <div className="p-5">
                <div className="h-3 bg-gray-800 rounded w-1/3 mb-3"></div>
                <div className="h-5 bg-gray-800 rounded mb-2"></div>
                <div className="h-5 bg-gray-800 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-800 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div id="blog-pagination" className="flex justify-center gap-2 mt-12"></div>
      </div>

      {/* Generate CTA */}
      <section className="bg-indigo-500/10 border-y border-indigo-500/20 py-16 text-center">
        <h2 className="text-3xl font-black mb-4">Ready to automate your listings?</h2>
        <p className="text-gray-400 mb-8">Generate 500+ product listings in 20 minutes with free AI.</p>
        <Link href="/dashboard" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-8 py-4 rounded-xl transition-colors inline-block">
          Start Free →
        </Link>
      </section>

      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/" className="hover:text-gray-300">Home</Link>
          <Link href="/terms" className="hover:text-gray-300">Terms</Link>
          <Link href="/privacy" className="hover:text-gray-300">Privacy</Link>
          <Link href="/contact" className="hover:text-gray-300">Contact</Link>
        </div>
      </footer>

      {/* Client-side blog loader */}
      <script dangerouslySetInnerHTML={{ __html: `
        let currentPage = 1;
        async function loadPosts(page=1, q='', cat='') {
          const grid = document.getElementById('blog-grid');
          const params = new URLSearchParams({page, limit:9, ...(q&&{q}), ...(cat&&cat!='All'&&{category:cat.toLowerCase().replace(/\\s+/g,'-')})});
          try {
            const res = await fetch('/api/blog/posts?' + params);
            const d = await res.json();
            if (!d.posts?.length) {
              grid.innerHTML = '<div class="col-span-3 text-center py-16 text-gray-500"><div class="text-4xl mb-4">📝</div><p>No posts yet. Check back soon!</p></div>';
              return;
            }
            grid.innerHTML = d.posts.map(p => \`
              <article class="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-colors">
                <div class="h-48 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-5xl">
                  \${p.category?.icon||'📝'}
                </div>
                <div class="p-5">
                  <div class="flex items-center gap-2 mb-3">
                    \${p.category?'<span class="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">'+p.category.name+'</span>':''}
                    <span class="text-xs text-gray-500">\${p.readTime} min read</span>
                  </div>
                  <h2 class="font-bold text-white text-base mb-2 line-clamp-2 hover:text-indigo-400">
                    <a href="/blog/\${p.slug}">\${p.title}</a>
                  </h2>
                  <p class="text-gray-400 text-sm line-clamp-2 mb-4">\${p.excerpt}</p>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-500">\${p.authorName}</span>
                    <a href="/blog/\${p.slug}" class="text-xs text-indigo-400 hover:underline">Read →</a>
                  </div>
                </div>
              </article>\`).join('');
            // Pagination
            const pag = document.getElementById('blog-pagination');
            if (d.pages > 1) {
              pag.innerHTML = Array.from({length:d.pages},(_,i)=>i+1).map(n=>
                '<button onclick="loadPosts('+n+')" class="px-3 py-1.5 rounded-lg text-sm font-medium '+(n===d.page?'bg-indigo-500 text-white':'bg-gray-800 text-gray-400 hover:text-white')+'">'+n+'</button>'
              ).join('');
            }
          } catch(e) {
            grid.innerHTML = '<div class="col-span-3 text-center py-16 text-gray-500">Failed to load posts.</div>';
          }
        }
        loadPosts();
      `}} />
    </div>
  )
}
