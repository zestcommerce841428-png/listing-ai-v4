import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Settings', description: 'Configure your AI providers, API keys, and listing preferences.' }
export default function SettingsPage() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-black text-white">Settings</h1><p className="text-gray-400 text-sm mt-1">Configure AI providers, API keys, and preferences</p></div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-bold text-white mb-4">🤖 AI Provider Keys</h2>
            <p className="text-gray-400 text-xs mb-4">Keys stored in browser session only — never saved to our servers.</p>
            {[
              { name:'Groq',label:'⚡ Groq — FREE 14,400/day',hint:'Get key: console.groq.com',ph:'gsk_…',color:'#f97316' },
              { name:'Gemini',label:'✨ Gemini — FREE 1,500/day',hint:'Get key: aistudio.google.com',ph:'AIzaSy…',color:'#4285f4' },
              { name:'Ollama',label:'🦙 Ollama — FREE ∞ local',hint:'Install: ollama.com → ollama pull gemma2:2b',ph:'gemma2:2b',color:'#22c55e' },
              { name:'OpenAI',label:'🤖 OpenAI (paid)',hint:'Get key: platform.openai.com',ph:'sk-…',color:'#10a37f' },
            ].map(p => (
              <div key={p.name} className="mb-4 bg-gray-800 border border-gray-700 rounded-lg p-4" style={{borderLeft: `3px solid ${p.color}`}}>
                <div className="font-semibold text-white text-sm mb-1">{p.label}</div>
                <div className="text-xs text-gray-500 mb-2">{p.hint}</div>
                <div className="flex gap-2">
                  <input type="password" placeholder={p.ph} className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"/>
                  <button className="text-xs border border-gray-600 text-gray-300 px-3 py-1.5 rounded hover:border-gray-400 transition-colors">Test</button>
                </div>
              </div>
            ))}
            <div className="mb-4 bg-gray-800 border border-orange-500/30 rounded-lg p-4">
              <div className="font-semibold text-orange-400 text-sm mb-1">☁️ AWS Bedrock</div>
              <div className="text-xs text-gray-500 mb-3">Access 44 models: Claude 3.5, Llama 3.3, Nova, Mistral, Titan, Cohere, AI21</div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input type="text" placeholder="Access Key ID" className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:border-orange-400 focus:outline-none"/>
                <input type="password" placeholder="Secret Access Key" className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:border-orange-400 focus:outline-none"/>
              </div>
              <div className="flex gap-2">
                <select className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:border-orange-400 focus:outline-none">
                  <option value="us-east-1">us-east-1 — N. Virginia ★</option>
                  <option value="us-west-2">us-west-2 — Oregon</option>
                  <option value="eu-west-1">eu-west-1 — Ireland</option>
                  <option value="ap-southeast-1">ap-southeast-1 — Singapore</option>
                </select>
                <button className="text-xs border border-orange-500/50 text-orange-400 px-3 py-1.5 rounded hover:bg-orange-500/10 transition-colors">Test</button>
              </div>
            </div>
            <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-lg transition-colors text-sm">💾 Save All Keys</button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-bold text-white mb-4">🧠 LLM Configuration</h2>
            {[['Default Provider',<select key="prov" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none mt-1"><option>Groq</option><option>Gemini</option><option>Ollama</option><option>OpenAI</option><option>Bedrock</option></select>],
              ['Default Tone',<select key="tone" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none mt-1"><option>Professional</option><option>Friendly</option><option>Luxury</option><option>Budget</option><option>Technical</option><option>Urgent</option></select>],
              ['Max Tokens',<select key="tok" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none mt-1"><option>600 (fast)</option><option>900 (default)</option><option>1200 (detailed)</option><option>1600 (max)</option></select>]
            ].map(([l,el]) => (<div key={l as string} className="mb-3"><label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{l}</label>{el}</div>))}
            <div className="mb-3"><label className="text-xs text-gray-400 font-semibold uppercase tracking-wide block mb-1">System Prompt (blank = default)</label><textarea className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white h-20 resize-none focus:border-indigo-500 focus:outline-none" placeholder="You are an expert ecommerce copywriter…"/></div>
            <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-lg transition-colors text-sm">💾 Save LLM Settings</button>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-bold text-white mb-3">📖 Free AI Guide</h2>
            <div className="space-y-2 text-sm">
              {[['⚡ Groq llama-3.3-70b','Best for bulk. 14,400 free/day. Fastest.'],['✨ Gemini 2.0 Flash','Great for SEO copy. 1,500 free/day.'],['🦙 Ollama gemma2:2b','100% offline, private. 2GB RAM.'],['☁️ Bedrock Nova Micro','Cheapest paid. Excellent quality.']].map(([t,d]) => (<div key={t as string}><div className="font-medium text-gray-200">{t}</div><div className="text-gray-500 text-xs">{d}</div></div>))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
