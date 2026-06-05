import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Admin Dashboard', robots: { index: false } }

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-red-500 rounded-lg flex items-center justify-center font-bold text-xs">SA</div>
            <span className="font-bold">Super Admin</span>
          </Link>
          <span className="text-gray-600">|</span>
          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">ADMIN PANEL</span>
        </div>
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">← App Dashboard</Link>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">Super Admin Panel</h1>
          <p className="text-gray-400 mt-1">Manage everything from one place</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" id="admin-stats">
          {[['👥 Users','—','Total registered'],['📦 Products','—','Total in DB'],['📝 Blog Posts','—','Published'],['💬 Messages','—','Unread']].map(([l,v,s]) => (
            <div key={l as string} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="text-lg font-bold text-white">{l}</div>
              <div className="text-3xl font-black text-indigo-400 my-1">{v}</div>
              <div className="text-xs text-gray-500">{s}</div>
            </div>
          ))}
        </div>

        {/* Admin Nav */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { href:'/admin/users', icon:'👥', title:'User Management', desc:'View, ban, update plans' },
            { href:'/admin/contact', icon:'💬', title:'Contact Messages', desc:'Read & reply to messages' },
            { href:'/admin/blog', icon:'📝', title:'Blog Manager', desc:'Create, edit, delete posts' },
            { href:'/admin/settings', icon:'⚙️', title:'Site Settings', desc:'All platform settings' },
          ].map(item => (
            <Link key={item.href} href={item.href} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-indigo-500/50 transition-colors block">
              <div className="text-3xl mb-3">{item.icon}</div>
              <div className="font-bold text-white text-sm mb-1">{item.title}</div>
              <div className="text-xs text-gray-500">{item.desc}</div>
            </Link>
          ))}
        </div>

        {/* Recent Messages */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">Recent Contact Messages</h2>
            <Link href="/admin/contact" className="text-sm text-indigo-400 hover:underline">View All →</Link>
          </div>
          <div id="recent-messages">
            <div className="text-center py-8 text-gray-500 text-sm">Loading messages…</div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        async function loadAdminData() {
          try {
            const [usersRes, contactRes, blogRes, prodRes] = await Promise.all([
              fetch('/api/admin/users?limit=1'),
              fetch('/api/contact?status=unread&limit=5'),
              fetch('/api/blog/posts?limit=1&status=published'),
              fetch('/api/products?limit=1'),
            ]);
            const [u,c,b,p] = await Promise.all([usersRes.json(),contactRes.json(),blogRes.json(),prodRes.json()]);
            const stats = document.querySelectorAll('#admin-stats .text-3xl');
            if(stats[0]) stats[0].textContent = u.total||'0';
            if(stats[1]) stats[1].textContent = p.total||'0';
            if(stats[2]) stats[2].textContent = b.total||'0';
            if(stats[3]) stats[3].textContent = c.statusCounts?.unread||'0';
            // Recent messages
            const msgs = document.getElementById('recent-messages');
            if(c.messages?.length) {
              msgs.innerHTML = c.messages.map(m =>
                '<div class="flex items-start gap-3 py-3 border-b border-gray-800 last:border-0">'
                +'<div class="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 font-bold text-sm flex-shrink-0">'+m.name[0]+'</div>'
                +'<div class="flex-1 min-w-0">'
                +'<div class="flex items-center gap-2"><span class="font-semibold text-sm text-white">'+m.name+'</span><span class="text-xs text-gray-500">'+m.email+'</span><span class="ml-auto text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">'+m.status+'</span></div>'
                +'<div class="text-sm text-gray-400 mt-0.5 truncate">'+m.subject+'</div>'
                +'<div class="text-xs text-gray-500 mt-1">'+new Date(m.createdAt).toLocaleString()+'</div>'
                +'</div></div>'
              ).join('');
            } else {
              msgs.innerHTML = '<div class="text-center py-8 text-gray-500 text-sm">No unread messages.</div>';
            }
          } catch(e) { console.error(e); }
        }
        loadAdminData();
      `}} />
    </div>
  )
}
