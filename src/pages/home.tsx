import { html } from 'hono/html'
import { Layout } from './layout'

export function HomePage() {
  return (
    <Layout title="CuratedLux — Luxury Asset Valuation & Sourcing" active="home">
      {/* Hero Section */}
      <section class="hero-gradient rounded-2xl p-10 md:p-16 mb-10 text-center">
        <div class="inline-flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs tracking-widest text-gold mb-6">
          <span class="w-1.5 h-1.5 bg-gold rounded-full animate-pulse"></span>
          AI-POWERED AUTHENTICATION ENGINE v2.0
        </div>
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-4 leading-tight">
          Luxury Asset Intelligence<br/><span class="text-gold">Delivered Instantly</span>
        </h1>
        <p class="text-white/60 text-lg max-w-2xl mx-auto mb-8">
          AI-driven visual authentication, real-time market valuation, and curated client-dealer matching — 
          purpose-built for watches, handbags, jewelry, and exotic vehicles.
        </p>
        <div class="flex flex-wrap gap-4 justify-center">
          <a href="/valuation" class="bg-gold hover:bg-gold-dark text-black font-semibold px-8 py-3 rounded-lg transition-colors inline-flex items-center gap-2">
            <i class="fas fa-camera"></i> Authenticate an Asset
          </a>
          <a href="/inventory" class="border border-white/20 hover:border-white/40 text-white px-8 py-3 rounded-lg transition-colors inline-flex items-center gap-2">
            <i class="fas fa-boxes"></i> Browse Inventory
          </a>
        </div>
      </section>

      {/* Stats Cards */}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <StatCard icon="fa-gem" value="500+" label="Assets Authenticated" accent="gold" />
        <StatCard icon="fa-handshake" value="98.4%" label="Match Accuracy" accent="emerald" />
        <StatCard icon="fa-globe" value="42" label="Countries Served" accent="blue" />
        <StatCard icon="fa-shield-halved" value="100%" label="Insurance Ready" accent="violet" />
      </div>

      {/* Core Modules */}
      <h2 class="text-2xl font-serif font-bold text-white mb-6">Core Modules</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <ModuleCard
          href="/valuation"
          icon="fa-camera-retro"
          title="AI Valuation Scanner"
          desc="Upload an image or use your camera. Gemini 2.0 Flash analyzes logos, serials, bezels, and materials for instant authentication and market pricing."
          accent="gold"
        />
        <ModuleCard
          href="/matching"
          icon="fa-code-branch"
          title="Client-Dealer Matching"
          desc="Proprietary scoring engine matches buyer wants to authenticated inventory by brand, model, budget, and condition — scored and ranked."
          accent="emerald"
        />
        <ModuleCard
          href="/inventory"
          icon="fa-clipboard-check"
          title="Authenticated Inventory"
          desc="Full CRUD management with filtering by brand, category, and status. Every item carries a confidence score and forensic breakdown."
          accent="violet"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <ModuleCard
          href="/requests"
          icon="fa-magnifying-glass-dollar"
          title="Client Request Intake"
          desc="Formalize buyer sourcing requests with brand, model, budget ceilings, urgency tiers, and condition requirements. Track match status."
          accent="blue"
        />
        <ModuleCard
          href="/dossier"
          icon="fa-file-certificate"
          title="Dossier Generation"
          desc="Generate tamper-evident appraisal dossiers with QR verification codes, export counters, and full forensic breakdowns — insurance-ready."
          accent="rose"
        />
        <ModuleCard
          href="/matching"
          icon="fa-chart-pie"
          title="Dashboard & Analytics"
          desc="Real-time aggregation: total portfolio value, match pipeline, category breakdowns, urgency distribution, and export tracking."
          accent="amber"
        />
      </div>

      {/* Trust Strip */}
      <div class="mt-12 border-t border-white/10 pt-8 flex flex-wrap items-center justify-between gap-4 text-white/40 text-sm">
        <div class="flex items-center gap-2">
          <i class="fas fa-lock text-emerald-400"></i>
          <span>Bank-grade encryption. All API traffic over HTTPS.</span>
        </div>
        <div class="flex items-center gap-2">
          <i class="fas fa-robot text-gold"></i>
          <span>Powered by Gemini 2.0 Flash — Google AI</span>
        </div>
        <div class="flex items-center gap-2">
          <i class="fas fa-cloud text-blue-400"></i>
          <span>Edge-native on Cloudflare Pages + D1</span>
        </div>
      </div>
    </Layout>
  )
}

function StatCard({ icon, value, label, accent }: { icon: string; value: string; label: string; accent: string }) {
  const colors: Record<string, string> = {
    gold: 'bg-gold/10 border-gold/20 text-gold',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
  }
  return (
    <div class={`rounded-xl border p-5 ${colors[accent] || colors.gold}`}>
      <i class={`fas ${icon} text-2xl mb-2 opacity-60`}></i>
      <div class="text-2xl font-bold font-mono">{value}</div>
      <div class="text-xs mt-0.5 opacity-70">{label}</div>
    </div>
  )
}

function ModuleCard({ href, icon, title, desc, accent }: { href: string; icon: string; title: string; desc: string; accent: string }) {
  const borders: Record<string, string> = {
    gold: 'hover:border-gold/40',
    emerald: 'hover:border-emerald-400/40',
    violet: 'hover:border-violet-400/40',
    blue: 'hover:border-blue-400/40',
    rose: 'hover:border-rose-400/40',
    amber: 'hover:border-amber-400/40',
  }
  return (
    <a href={href} class={`block bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 hover:bg-white/[0.06] transition-all ${borders[accent] || 'hover:border-gold/40'}`}>
      <div class={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 bg-white/5`}>
        <i class={`fas ${icon} text-gold`}></i>
      </div>
      <h3 class="font-semibold text-white mb-2">{title}</h3>
      <p class="text-white/50 text-sm leading-relaxed">{desc}</p>
    </a>
  )
}
