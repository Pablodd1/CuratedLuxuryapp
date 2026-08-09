import { Layout } from './layout'

export function MatchingPage() {
  return (
    <Layout title="Client-Dealer Matching — CuratedLux" active="matching">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-serif font-bold text-white mb-1">Client-Dealer Matching</h1>
          <p class="text-white/50">Algorithmic scoring across brand, model, budget, and condition dimensions.</p>
        </div>
        <button id="run-match-btn"
          class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2 text-sm">
          <i class="fas fa-play"></i> Run Matchmaking
          <span id="match-spinner" class="hidden"><i class="fas fa-spinner fa-spin"></i></span>
        </button>
      </div>

      {/* Match Stats */}
      <div id="match-stats-bar" class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div class="bg-card border border-border rounded-lg p-4"><div class="text-xs text-white/40">Total Matches</div><div id="match-stat-total" class="text-xl font-bold text-white">—</div></div>
        <div class="bg-card border border-border rounded-lg p-4"><div class="text-xs text-white/40">Avg Score</div><div id="match-stat-avg" class="text-xl font-bold text-gold">—</div></div>
        <div class="bg-card border border-border rounded-lg p-4"><div class="text-xs text-white/40">Pending</div><div id="match-stat-pending" class="text-xl font-bold text-blue-400">—</div></div>
        <div class="bg-card border border-border rounded-lg p-4"><div class="text-xs text-white/40">Accepted</div><div id="match-stat-accepted" class="text-xl font-bold text-emerald-400">—</div></div>
      </div>

      {/* Match Cards */}
      <div id="match-results" class="space-y-4">
        <div class="bg-card border border-border rounded-xl p-8 text-center text-white/20">
          <i class="fas fa-code-branch text-4xl mb-3 opacity-20 block"></i>
          <p>Click "Run Matchmaking" to scan active requests against authenticated inventory.</p>
          <p class="text-xs mt-1">The scoring engine evaluates brand, model, budget, and condition matches.</p>
        </div>
      </div>
    </Layout>
  )
}
