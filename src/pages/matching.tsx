import { Layout } from './layout'

export function MatchingPage() {
  return (
    <Layout title="Match" active="match">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-sm font-semibold text-gold/60 tracking-wider uppercase">Matchmaking</h1>
        <button id="run-match-btn"
          class="bg-gold hover:bg-gold-light text-black font-semibold px-3 py-1.5 rounded text-xs transition-all inline-flex items-center gap-1.5">
          <i class="fas fa-play text-[10px]"></i> Run
          <span id="match-spinner" class="hidden"><i class="fas fa-spinner fa-spin"></i></span>
        </button>
      </div>

      <div id="match-stats-bar" class="grid grid-cols-4 gap-3 mb-4">
        <div class="bg-card border border-gold/[0.04] rounded p-3"><div class="text-[10px] text-gold/30 tracking-wider uppercase">Matches</div><div id="match-stat-total" class="text-sm font-bold text-gold">—</div></div>
        <div class="bg-card border border-gold/[0.04] rounded p-3"><div class="text-[10px] text-gold/30 tracking-wider uppercase">Avg</div><div id="match-stat-avg" class="text-sm font-bold text-gold">—</div></div>
        <div class="bg-card border border-gold/[0.04] rounded p-3"><div class="text-[10px] text-gold/30 tracking-wider uppercase">Pending</div><div id="match-stat-pending" class="text-sm font-bold text-blue-400">—</div></div>
        <div class="bg-card border border-gold/[0.04] rounded p-3"><div class="text-[10px] text-gold/30 tracking-wider uppercase">Accepted</div><div id="match-stat-accepted" class="text-sm font-bold text-emerald-400">—</div></div>
      </div>

      <div id="match-results" class="space-y-3">
        <div class="bg-card border border-gold/[0.04] rounded-lg p-6 text-center text-white/10">
          <p class="text-xs">Click "Run" to scan requests against inventory</p>
        </div>
      </div>
    </Layout>
  )
}
