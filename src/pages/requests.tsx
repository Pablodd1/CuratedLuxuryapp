import { Layout } from './layout'

export function RequestsPage() {
  return (
    <Layout title="Client Requests — CuratedLux" active="requests">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-serif font-bold text-white mb-1">Client Sourcing Requests</h1>
          <p class="text-white/50">Formalized buyer intakes — track wants, budgets, and match status.</p>
        </div>
        <button onclick="document.getElementById('add-request-modal').classList.remove('hidden')"
          class="bg-gold hover:bg-gold-dark text-black font-semibold px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2 text-sm">
          <i class="fas fa-plus"></i> New Request
        </button>
      </div>

      {/* Filters */}
      <div class="flex flex-wrap gap-3 mb-6">
        <input id="req-filter-brand" type="text" placeholder="Brand..."
          class="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50 w-32" />
        <select id="req-filter-urgency"
          class="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50">
          <option value="">All Urgency</option>
          <option>Immediate</option>
          <option>1-2 weeks</option>
          <option>Flexible</option>
        </select>
        <select id="req-filter-status"
          class="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50">
          <option value="active">Active</option>
          <option value="">All Status</option>
          <option value="matched">Matched</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button id="req-filter-btn"
          class="border border-white/10 hover:border-white/20 text-white/70 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors">
          <i class="fas fa-filter mr-1"></i> Apply
        </button>
      </div>

      {/* Stats */}
      <div id="req-stats-bar" class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div class="bg-card border border-border rounded-lg p-4"><div class="text-xs text-white/40">Active Requests</div><div id="req-stat-total" class="text-xl font-bold text-white">—</div></div>
        <div class="bg-card border border-border rounded-lg p-4"><div class="text-xs text-white/40">Total Budget</div><div id="req-stat-budget" class="text-xl font-bold text-gold">—</div></div>
        <div class="bg-card border border-border rounded-lg p-4"><div class="text-xs text-white/40">Immediate</div><div id="req-stat-immediate" class="text-xl font-bold text-rose-400">—</div></div>
        <div class="bg-card border border-border rounded-lg p-4"><div class="text-xs text-white/40">Matched</div><div id="req-stat-matched" class="text-xl font-bold text-emerald-400">—</div></div>
      </div>

      {/* Table */}
      <div class="bg-card border border-border rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-surface">
              <tr class="text-left text-white/40 text-xs uppercase tracking-wider">
                <th class="px-5 py-3">Client</th>
                <th class="px-5 py-3">Looking For</th>
                <th class="px-5 py-3">Budget</th>
                <th class="px-5 py-3">Urgency</th>
                <th class="px-5 py-3">Condition</th>
                <th class="px-5 py-3">Status</th>
                <th class="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody id="requests-tbody">
              <tr><td colspan={7} class="px-5 py-12 text-center text-white/20">
                <i class="fas fa-spinner fa-spin text-2xl mb-2 block"></i>Loading requests...
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Request Modal */}
      <div id="add-request-modal" class="hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onclick="if(event.target===this){this.classList.add('hidden')}">
        <div class="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <h2 class="text-lg font-semibold text-white mb-4">New Client Request</h2>
          <form id="add-request-form" class="space-y-3">
            <div>
              <label class="block text-xs text-white/40 mb-1">Client Name *</label>
              <input name="client_name" required placeholder="e.g., James Chen" class="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-white/40 mb-1">Looking For Brand *</label>
                <input name="looking_for_brand" required placeholder="e.g., Patek Philippe" class="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50" />
              </div>
              <div>
                <label class="block text-xs text-white/40 mb-1">Model *</label>
                <input name="looking_for_model" required placeholder="e.g., Nautilus 5811" class="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-white/40 mb-1">Budget (USD)</label>
                <input name="budget_usd" type="number" min="0" step="0.01" placeholder="0" class="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50" />
              </div>
              <div>
                <label class="block text-xs text-white/40 mb-1">Urgency</label>
                <select name="urgency" class="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50">
                  <option value="Flexible">Flexible</option><option value="1-2 weeks">1-2 weeks</option><option value="Immediate">Immediate</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-xs text-white/40 mb-1">Condition Required (0-4)</label>
              <input name="condition_required" type="number" min="0" max="4" value="3" class="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50" />
            </div>
            <div>
              <label class="block text-xs text-white/40 mb-1">Notes</label>
              <textarea name="notes" rows={2} placeholder="Any special requirements..." class="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50 resize-none"></textarea>
            </div>
            <button type="submit" class="w-full bg-gold hover:bg-gold-dark text-black font-semibold py-2.5 rounded-lg transition-colors text-sm">Create Request</button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
