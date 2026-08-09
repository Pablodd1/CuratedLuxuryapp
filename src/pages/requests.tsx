import { Layout } from './layout'

export function RequestsPage() {
  return (
    <Layout title="Requests" active="requests">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-sm font-semibold text-gold/60 tracking-wider uppercase">Client Requests</h1>
        <button onclick="document.getElementById('add-request-modal').classList.remove('hidden')"
          class="bg-gold hover:bg-gold-light text-black font-semibold px-3 py-1.5 rounded text-xs transition-all inline-flex items-center gap-1.5">
          <i class="fas fa-plus text-[10px]"></i> Add
        </button>
      </div>

      <div class="flex flex-wrap gap-2 mb-4">
        <input id="req-filter-brand" type="text" placeholder="Brand" class="bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/60 placeholder-white/15 focus:outline-none focus:border-gold/30 transition-all w-20" />
        <select id="req-filter-urgency" class="bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/60 focus:outline-none focus:border-gold/30 transition-all">
          <option value="">All</option><option>Immediate</option><option>1-2 weeks</option><option>Flexible</option>
        </select>
        <select id="req-filter-status" class="bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/60 focus:outline-none focus:border-gold/30 transition-all">
          <option value="active">Active</option><option value="">All</option><option value="matched">Matched</option><option value="fulfilled">Fulfilled</option><option value="cancelled">Cancelled</option>
        </select>
        <button id="req-filter-btn" class="border border-white/[0.06] text-white/30 hover:text-gold px-2.5 py-1.5 rounded text-xs transition-all">Filter</button>
      </div>

      <div id="req-stats-bar" class="grid grid-cols-4 gap-3 mb-4">
        <div class="bg-card border border-gold/[0.04] rounded p-3"><div class="text-[10px] text-gold/30 tracking-wider uppercase">Active</div><div id="req-stat-total" class="text-sm font-bold text-gold">—</div></div>
        <div class="bg-card border border-gold/[0.04] rounded p-3"><div class="text-[10px] text-gold/30 tracking-wider uppercase">Budget</div><div id="req-stat-budget" class="text-sm font-bold text-gold">—</div></div>
        <div class="bg-card border border-gold/[0.04] rounded p-3"><div class="text-[10px] text-gold/30 tracking-wider uppercase">Urgent</div><div id="req-stat-immediate" class="text-sm font-bold text-red-400">—</div></div>
        <div class="bg-card border border-gold/[0.04] rounded p-3"><div class="text-[10px] text-gold/30 tracking-wider uppercase">Matched</div><div id="req-stat-matched" class="text-sm font-bold text-emerald-400">—</div></div>
      </div>

      <div class="bg-card border border-gold/[0.04] rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead class="bg-surface">
              <tr class="text-left text-gold/25 uppercase tracking-wider">
                <th class="px-3 py-2">Client</th><th class="px-3 py-2">Looking For</th><th class="px-3 py-2">Budget</th><th class="px-3 py-2">Urgency</th><th class="px-3 py-2">Cond</th><th class="px-3 py-2">Status</th><th class="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody id="requests-tbody">
              <tr><td colspan={7} class="px-3 py-10 text-center text-white/10"><i class="fas fa-spinner fa-spin text-lg mb-1 block"></i></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div id="add-request-modal" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onclick="if(event.target===this){this.classList.add('hidden')}">
        <div class="bg-card border border-gold/[0.06] rounded-lg p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h2 class="text-sm font-semibold text-gold mb-3 tracking-wider uppercase">New Request</h2>
          <form id="add-request-form" class="space-y-2.5">
            <div>
              <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Client</label>
              <input name="client_name" required placeholder="James Chen" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/10 focus:outline-none focus:border-gold/30 transition-all" />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Brand</label>
                <input name="looking_for_brand" required placeholder="Patek Philippe" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/10 focus:outline-none focus:border-gold/30 transition-all" />
              </div>
              <div>
                <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Model</label>
                <input name="looking_for_model" required placeholder="Nautilus 5811" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/10 focus:outline-none focus:border-gold/30 transition-all" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Budget USD</label>
                <input name="budget_usd" type="number" min="0" step="0.01" placeholder="0" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/10 focus:outline-none focus:border-gold/30 transition-all" />
              </div>
              <div>
                <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Urgency</label>
                <select name="urgency" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-gold/30 transition-all">
                  <option value="Flexible">Flexible</option><option value="1-2 weeks">1-2 weeks</option><option value="Immediate">Immediate</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Condition (0-4)</label>
              <input name="condition_required" type="number" min="0" max="4" value="3" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-gold/30 transition-all" />
            </div>
            <div>
              <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Notes</label>
              <textarea name="notes" rows={2} placeholder="..." class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/10 focus:outline-none focus:border-gold/30 transition-all resize-none"></textarea>
            </div>
            <button type="submit" class="w-full bg-gold hover:bg-gold-light text-black font-semibold py-2 rounded text-xs transition-all">Create</button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
