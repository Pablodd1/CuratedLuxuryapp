import { Layout } from './layout'

export function HomePage() {
  return (
    <Layout title="CuratedLux" active="scan">
      <div class="max-w-2xl mx-auto text-center py-16">
        <h1 class="text-2xl font-bold text-gold tracking-widest uppercase mb-3">CuratedLux</h1>
        <p class="text-white/30 text-xs tracking-wider mb-8">Luxury Asset Valuation</p>
        <a href="/valuation"
          class="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-black font-semibold px-6 py-3 rounded text-sm transition-all shadow-[0_0_30px_rgba(180,150,30,0.15)] hover:shadow-[0_0_40px_rgba(180,150,30,0.25)]">
          <i class="fas fa-camera"></i> Start Scanning
        </a>
      </div>
    </Layout>
  )
}
