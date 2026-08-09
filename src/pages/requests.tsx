import { Layout } from './layout'

export function RequestsPage() {
  return (
    <Layout title="Requests" active="requests">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-sm font-medium text-white/60">Client Requests</h1>
        <button onclick="document.getElementById('add-request-modal').classList.remove('hidden')"
          class="bg-white hover:bg-white/90 text-black font-medium px-3 py-1.5 rounded text-xs transition-colors inline-flex items-center gap-1.5">
          <i class="fas fa-plus text-[10px]"></i> Add
        </button>
      </div>

      <div class="flex flex-wrap gap-2 mb-4">
        <input id="req-filter-brand" type="text" placeholder="Brand" class="bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/20 w-20" />
        <select id="req-filter-urgency" class="bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/20">
          <option value="">All</option><option>Immediate</option><option>1-2 weeks</option><option>Flexible</option>
        </select>
        <select id="req-filter-status" class="bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/20">
          <option value="active">Active</option><option value="">All</option><option value="matched">Matched</option><option value="fulfilled">Fulfilled</option><option value="cancelled">Cancelled</option>
        </select>
        <button id="req-filter-btn" class="border border-white/10 text-white/50 hover:text-white/80 px-2.5 py-1.5 rounded text-xs transition-colors">Filter</button>
      </div>

      <div id="req-stats-bar" class="grid grid-cols-4 gap-3 mb-4">
        <div class="bg-card border border-border rounded p-3"><div class="text-[10px] text-white/30">Active</div><div id="req-stat-total" class="text-sm font-bold text-white">—</div></div>
        <div class="bg-card border border-border rounded p-3"><div class="text-[10px] text-white/30">Budget</div><div id="req-stat-budget" class="text-sm font-bold text-white">—</div></div>
        <div class="bg-card border border-border rounded p-3"><div class="text-[10px] text-white/30">Urgent</div><div id="req-stat-immediate" class="text-sm font-bold text-red-400">—</div></div>
        <div class="bg-card border border-border rounded p-3"><div class="text-[10px] text-white/30">Matched</div><div id="req-stat-matched" class="text-sm font-bold text-emerald-400">—</div></div>
      </div>

      <div class="bg-card border border-border rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead class="bg-surface">
              <tr class="text-left text-white/30 uppercase tracking-wider">
                <th class="px-3 py-2">Client</th><th class="px-3 py-2">Looking For</th><th class="px-3 py-2">Budget</th><th class="px-3 py-2">Urgency</th><th class="px-3 py-2">Cond</th><th class="px-3 py-2">Status</th><th class="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody id="requests-tbody">
              <tr><td colspan={7} class="px-3 py-10 text-center text-white/15"><i class="fas fa-spinner fa-spin text-lg mb-1 block"></i></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div id="add-request-modal" class="hidden fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onclick="if(event.target===this){this.classList.add('hidden')}">
        <div class="bg-card border border-border rounded-lg p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h2 class="text-sm font-medium text-white mb-3">New Request</h2>
          <form id="add-request-form" class="space-y-2.5">
            <div>
              <label class="block text-[10px] text-white/30 mb-0.5">Client</label>
              <input name="client_name" required placeholder="James Chen" class="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-white placeholder-white/15 focus:outline-none focus:border-white/20" />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] text-white/30 mb-0.5">Brand</label>
                <input name="looking_for_brand" required placeholder="Patek Philippe" class="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-white placeholder-white/15 focus:outline-none focus:border-white/20" />
              </div>
              <div>
                <label class="block text-[10px] text-white/30 mb-0.5">Model</label>
                <input name="looking_for_model" required placeholder="Nautilus 5811" class="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-white placeholder-white/15 focus:outline-none focus:border-white/20" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] text-white/30 mb-0.5">Budget USD</label>
                <input name="budget_usd" type="number" min="0" step="0.01" placeholder="0" class="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-white placeholder-white/15 focus:outline-none focus:border-white/20" />
              </div>
              <div>
                <label class="block text-[10px] text-white/30 mb-0.5">Urgency</label>
                <select name="urgency" class="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/20">
                  <option value="Flexible">Flexible</option><option value="1-2 weeks">1-2 weeks</option><option value="Immediate">Immediate</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-[10px] text-white/30 mb-0.5">Condition (0-4)</label>
              <input name="condition_required" type="number" min="0" max="4" value="3" class="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/20" />
            </div>
            <div>
              <label class="block text-[10px] text-white/30 mb-0.5">Notes</label>
              <textarea name="notes" rows={2} placeholder="..." class="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-white placeholder-white/15 focus:outline-none focus:border-white/20 resize-none"></textarea>
            </div>
            <button type="submit" class="w-full bg-white hover:bg-white/90 text-black font-medium py-2 rounded text-xs transition-colors">Create</button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
