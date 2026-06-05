import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Admin — Contact Messages', robots: { index: false } }

export default function AdminContactPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-white text-sm">← Admin</Link>
        <span className="text-gray-600">/</span>
        <span className="font-bold">Contact Messages</span>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black">Contact Messages</h1>
          <div className="flex gap-2">
            {['all','unread','read','replied'].map(s => (
              <button key={s} onClick={`filterStatus('${s}')`} className={`contact-filter px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${s==='all'?'bg-indigo-500 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`} data-status={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div id="messages-list" className="space-y-4">
          <div className="text-center py-12 text-gray-500">Loading messages…</div>
        </div>

        <div id="messages-pagination" className="flex justify-center gap-2 mt-8"></div>
      </div>

      {/* Reply modal */}
      <div id="reply-modal" className="fixed inset-0 bg-black/75 z-50 items-center justify-center hidden">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-lg w-full mx-4">
          <h3 className="font-bold text-white text-lg mb-4">Reply to Message</h3>
          <div id="modal-original" className="bg-gray-800 rounded-lg p-3 mb-4 text-sm text-gray-400"></div>
          <textarea id="reply-text" rows={5} placeholder="Type your reply…" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-indigo-500 focus:outline-none mb-4 resize-none"></textarea>
          <div class="flex gap-3">
            <button id="send-reply-btn" className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-lg text-sm transition-colors">Send Reply via Email</button>
            <button onclick="closeReplyModal()" className="px-4 border border-gray-700 text-gray-400 rounded-lg text-sm hover:text-white">Cancel</button>
          </div>
          <div id="reply-result" className="mt-3 text-sm hidden"></div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        let currentMsgId = null;
        let currentStatus = 'all';

        async function loadMessages(page=1, status='all') {
          const list = document.getElementById('messages-list');
          const params = new URLSearchParams({page, limit:15, ...(status!=='all'&&{status})});
          try {
            const res = await fetch('/api/contact?'+params);
            const d = await res.json();
            if(!d.messages?.length) { list.innerHTML='<div class="text-center py-12 text-gray-500">No messages found.</div>'; return; }
            list.innerHTML = d.messages.map(m => \`
              <div class="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3 mb-2 flex-wrap">
                      <span class="font-bold text-white">\${m.name}</span>
                      <span class="text-sm text-gray-400">\${m.email}</span>
                      <span class="text-xs px-2 py-0.5 rounded-full \${m.status==='unread'?'bg-yellow-500/20 text-yellow-400':m.status==='replied'?'bg-green-500/20 text-green-400':'bg-gray-700 text-gray-400'}">\${m.status}</span>
                    </div>
                    <div class="font-semibold text-sm text-white mb-1">\${m.subject}</div>
                    <div class="text-gray-400 text-sm line-clamp-2">\${m.message}</div>
                    <div class="text-xs text-gray-500 mt-2">\${new Date(m.createdAt).toLocaleString()}</div>
                    \${m.reply?'<div class="mt-3 bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm text-green-300"><strong>Reply sent:</strong> '+m.reply+'</div>':''}
                  </div>
                  <div class="flex gap-2 flex-shrink-0">
                    <button onclick="openReply(\${m.id},''+\${JSON.stringify(m.message)+'},'+\${JSON.stringify(m.name)+'})" class="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">Reply</button>
                    <button onclick="markStatus(\${m.id},'read')" class="border border-gray-700 text-gray-400 text-xs px-3 py-1.5 rounded-lg hover:text-white transition-colors">Mark Read</button>
                    <button onclick="deleteMsg(\${m.id})" class="border border-red-500/30 text-red-400 text-xs px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">✕</button>
                  </div>
                </div>
              </div>\`).join('');
          } catch(e) { list.innerHTML='<div class="text-center py-12 text-red-400">'+e.message+'</div>'; }
        }

        function filterStatus(s) {
          currentStatus = s;
          document.querySelectorAll('.contact-filter').forEach(b => {
            b.className = b.dataset.status===s
              ? 'contact-filter px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500 text-white transition-colors'
              : 'contact-filter px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 text-gray-400 hover:text-white transition-colors';
          });
          loadMessages(1, s);
        }

        function openReply(id, message, name) {
          currentMsgId = id;
          document.getElementById('modal-original').innerHTML = '<strong>From '+name+':</strong> '+message;
          document.getElementById('reply-text').value = '';
          document.getElementById('reply-result').classList.add('hidden');
          document.getElementById('reply-modal').classList.remove('hidden');
          document.getElementById('reply-modal').style.display='flex';
        }

        function closeReplyModal() {
          document.getElementById('reply-modal').style.display='none';
        }

        document.getElementById('send-reply-btn').onclick = async () => {
          const reply = document.getElementById('reply-text').value.trim();
          if(!reply) return;
          const btn = document.getElementById('send-reply-btn');
          const res2 = document.getElementById('reply-result');
          btn.disabled=true; btn.textContent='Sending…';
          try {
            const r = await fetch('/api/contact/'+currentMsgId,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reply',reply})});
            const d = await r.json();
            res2.className = d.success?'mt-3 text-sm text-green-400':'mt-3 text-sm text-red-400';
            res2.textContent = d.success?'✅ Reply sent!'+(d.emailSent?' Email delivered.':' (Email not configured)'):'❌ '+d.error;
            res2.classList.remove('hidden');
            if(d.success) { setTimeout(()=>{closeReplyModal();loadMessages(1,currentStatus);},2000); }
          } catch(e) { res2.textContent='❌ '+e.message; res2.classList.remove('hidden'); }
          btn.disabled=false; btn.textContent='Send Reply via Email';
        };

        async function markStatus(id, status) {
          await fetch('/api/contact/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
          loadMessages(1, currentStatus);
        }

        async function deleteMsg(id) {
          if(!confirm('Delete this message?')) return;
          await fetch('/api/contact/'+id,{method:'DELETE'});
          loadMessages(1, currentStatus);
        }

        loadMessages();
      `}} />
    </div>
  )
}
