import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Admin — Site Settings', robots: { index: false } }

const SETTING_GROUPS = [
  { key:'general', label:'🏢 General', desc:'Site name, tagline, support email' },
  { key:'features', label:'⚡ Features', desc:'Registration, maintenance mode, limits' },
  { key:'seo', label:'📊 SEO & Analytics', desc:'Google Analytics, AdSense, Search Console' },
  { key:'smtp', label:'📧 Email / SMTP', desc:'Gmail, Microsoft, Hostinger mail setup' },
  { key:'integrations', label:'🔗 Integrations', desc:'reCAPTCHA, WhatsApp, Tawk.to chat' },
  { key:'blog', label:'📝 Blog', desc:'Enable blog, posts per page' },
  { key:'ads', label:'💰 Ads & Custom Code', desc:'Header/footer ad code, custom CSS' },
]

export default function AdminSettingsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-white text-sm">← Admin</Link>
          <span className="text-gray-600">/</span>
          <span className="font-bold">Site Settings</span>
        </div>
        <button id="save-all-btn" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-5 py-2 rounded-lg text-sm transition-colors">💾 Save All Settings</button>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black">Site Settings</h1>
            <p className="text-gray-400 text-sm mt-1">All settings managed here are applied globally across the platform</p>
          </div>
          <button id="seed-btn" className="border border-gray-700 text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors">↻ Reset to Defaults</button>
        </div>

        {/* Settings tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {SETTING_GROUPS.map(g => (
            <button key={g.key} onclick={`showGroup('${g.key}')`} className={`settings-tab px-4 py-2 rounded-lg text-sm font-medium transition-colors ${g.key==='general'?'bg-indigo-500 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`} data-group={g.key}>
              {g.label}
            </button>
          ))}
        </div>

        {/* Settings form */}
        <div id="settings-form" className="space-y-4">
          <div className="text-center py-12 text-gray-500">Loading settings…</div>
        </div>

        <div id="settings-result" className="mt-6 text-sm text-center hidden"></div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        let allSettings = {};
        let currentGroup = 'general';

        const FIELD_DEFS = {
          general: [{k:'site_name',l:'Site Name',t:'text'},{k:'site_tagline',l:'Tagline',t:'text'},{k:'support_email',l:'Support Email',t:'email'},{k:'admin_email',l:'Admin Notification Email',t:'email'},{k:'super_admin_clerk_id',l:'Super Admin Clerk ID',t:'text',hint:'Your Clerk user ID — gives full admin access'}],
          features: [{k:'maintenance_mode',l:'Maintenance Mode',t:'toggle'},{k:'allow_registration',l:'Allow New Registrations',t:'toggle'},{k:'max_products_per_user',l:'Max Products Per User (0 = unlimited)',t:'number'}],
          seo: [{k:'google_analytics_id',l:'Google Analytics ID (G-XXXXXXXX)',t:'text'},{k:'google_adsense_id',l:'Google AdSense Publisher ID',t:'text'},{k:'google_site_verification',l:'Google Search Console Verification Code',t:'text'}],
          smtp: [{k:'smtp_provider',l:'Provider',t:'select',opts:['gmail','microsoft','hostinger','custom']},{k:'smtp_host',l:'SMTP Host',t:'text'},{k:'smtp_port',l:'SMTP Port',t:'number'},{k:'smtp_secure',l:'Use TLS (port 465)',t:'toggle'},{k:'smtp_user',l:'SMTP Username / Email',t:'email'},{k:'smtp_pass',l:'SMTP Password / App Password',t:'password'},{k:'smtp_from_name',l:'From Name',t:'text'},{k:'smtp_from_email',l:'From Email',t:'email'}],
          integrations: [{k:'recaptcha_v3_site_key',l:'reCAPTCHA v3 Site Key',t:'text'},{k:'recaptcha_v3_secret_key',l:'reCAPTCHA v3 Secret Key',t:'password'},{k:'tawk_property_id',l:'Tawk.to Property ID',t:'text'},{k:'tawk_widget_id',l:'Tawk.to Widget ID',t:'text'},{k:'whatsapp_number',l:'WhatsApp Number (e.g. +1234567890)',t:'text'},{k:'whatsapp_message',l:'WhatsApp Default Message',t:'text'}],
          blog: [{k:'blog_enabled',l:'Enable Blog',t:'toggle'},{k:'posts_per_page',l:'Posts Per Page',t:'number'}],
          ads: [{k:'header_ad_code',l:'Header Ad / Analytics Code',t:'textarea',hint:'Injected in <head> — Google Analytics, AdSense, custom scripts'},{k:'footer_ad_code',l:'Footer Ad Code',t:'textarea'},{k:'custom_css',l:'Custom CSS',t:'textarea'}],
        };

        async function loadSettings() {
          try {
            const res = await fetch('/api/admin/settings');
            const d = await res.json();
            d.settings.forEach(s => { allSettings[s.key] = s.value; });
          } catch(e) { /* new install — no settings yet */ }
          renderGroup(currentGroup);
        }

        function renderGroup(group) {
          currentGroup = group;
          document.querySelectorAll('.settings-tab').forEach(t => {
            t.className = t.dataset.group===group
              ? 'settings-tab px-4 py-2 rounded-lg text-sm font-medium bg-indigo-500 text-white transition-colors'
              : 'settings-tab px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-400 hover:text-white transition-colors';
          });
          const fields = FIELD_DEFS[group] || [];
          const form = document.getElementById('settings-form');
          form.innerHTML = fields.map(f => {
            const val = allSettings[f.k] || '';
            if(f.t === 'toggle') return \`
              <div class="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between">
                <div><div class="font-semibold text-white text-sm">\${f.l}</div>\${f.hint?'<div class="text-xs text-gray-500 mt-0.5">'+f.hint+'</div>':''}</div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" data-key="\${f.k}" \${val==='true'?'checked':''} class="sr-only peer" onchange="allSettings['\${f.k}']=this.checked?'true':'false'">
                  <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
              </div>\`;
            if(f.t === 'textarea') return \`
              <div class="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <label class="block text-sm font-semibold text-white mb-1">\${f.l}</label>
                \${f.hint?'<div class="text-xs text-gray-500 mb-2">'+f.hint+'</div>':''}
                <textarea data-key="\${f.k}" rows="4" oninput="allSettings['\${f.k}']=this.value" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none">\${val}</textarea>
              </div>\`;
            if(f.t === 'select') return \`
              <div class="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <label class="block text-sm font-semibold text-white mb-2">\${f.l}</label>
                <select data-key="\${f.k}" onchange="allSettings['\${f.k}']=this.value;updateSMTPDefaults(this.value)" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
                  \${f.opts.map(o=>'<option value="'+o+'" '+(val===o?'selected':'')+'>'+o+'</option>').join('')}
                </select>
              </div>\`;
            return \`
              <div class="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <label class="block text-sm font-semibold text-white mb-2">\${f.l}</label>
                \${f.hint?'<div class="text-xs text-gray-500 mb-2">'+f.hint+'</div>':''}
                <input type="\${f.t}" data-key="\${f.k}" value="\${val}" oninput="allSettings['\${f.k}']=this.value" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"/>
              </div>\`;
          }).join('');
        }

        function showGroup(g) { renderGroup(g); }

        function updateSMTPDefaults(provider) {
          const defaults = {gmail:{host:'smtp.gmail.com',port:'587'},microsoft:{host:'smtp.office365.com',port:'587'},hostinger:{host:'smtp.hostinger.com',port:'587'}};
          if(defaults[provider]) { allSettings.smtp_host=defaults[provider].host; allSettings.smtp_port=defaults[provider].port; renderGroup('smtp'); }
        }

        document.getElementById('save-all-btn').onclick = async () => {
          const btn = document.getElementById('save-all-btn');
          const res2 = document.getElementById('settings-result');
          btn.disabled=true; btn.textContent='Saving…';
          try {
            const r = await fetch('/api/admin/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({settings:allSettings})});
            const d = await r.json();
            res2.className = 'mt-6 text-sm text-center text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg p-3';
            res2.textContent = d.success ? '✅ All settings saved successfully.' : '❌ '+d.error;
          } catch(e) { res2.textContent='❌ '+e.message; }
          btn.disabled=false; btn.textContent='💾 Save All Settings';
          res2.classList.remove('hidden');
          setTimeout(()=>res2.classList.add('hidden'),5000);
        };

        document.getElementById('seed-btn').onclick = async () => {
          if(!confirm('Reset to default settings? This will not overwrite values you have already set.')) return;
          await fetch('/api/admin/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'seed'})});
          await loadSettings();
        };

        loadSettings();
      `}} />
    </div>
  )
}
