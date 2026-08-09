import { Layout } from './layout'

export function InventoryPage() {
  return (
    <Layout title="Items" active="items">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-sm font-semibold text-gold/60 tracking-wider uppercase">Inventory</h1>
        <button onclick="document.getElementById('add-item-modal').classList.remove('hidden')"
          class="bg-gold hover:bg-gold-light text-black font-semibold px-3 py-1.5 rounded text-xs transition-all inline-flex items-center gap-1.5">
          <i class="fas fa-plus text-[10px]"></i> Add
        </button>
      </div>

      {/* Filters */}
      <div class="flex flex-wrap gap-2 mb-4">
        <select id="filter-category" class="bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/60 focus:outline-none focus:border-gold/30 transition-all">
          <option value="">All</option>
          <option>Watches</option><option>Handbags</option><option>Fine Jewelry</option><option>Art & Collectibles</option><option>Luxury Vehicles</option>
        </select>
        <input id="filter-brand" type="text" placeholder="Brand" class="bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/60 placeholder-white/15 focus:outline-none focus:border-gold/30 transition-all w-20" />
        <select id="filter-status" class="bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/60 focus:outline-none focus:border-gold/30 transition-all">
          <option value="active">Active</option><option value="">All</option><option value="locked">Locked</option><option value="sold">Sold</option><option value="archived">Archived</option>
        </select>
        <button id="filter-btn" class="border border-white/[0.06] text-white/30 hover:text-gold px-2.5 py-1.5 rounded text-xs transition-all">Filter</button>
        <span id="filter-count" class="text-white/15 text-xs self-center"></span>
      </div>

      {/* Stats */}
      <div id="stats-bar" class="grid grid-cols-4 gap-3 mb-4">
        <div class="bg-card border border-gold/[0.04] rounded p-3"><div class="text-[10px] text-gold/30 tracking-wider uppercase">Items</div><div id="stat-total" class="text-sm font-bold text-gold">—</div></div>
        <div class="bg-card border border-gold/[0.04] rounded p-3"><div class="text-[10px] text-gold/30 tracking-wider uppercase">Value</div><div id="stat-value" class="text-sm font-bold text-gold">—</div></div>
        <div class="bg-card border border-gold/[0.04] rounded p-3"><div class="text-[10px] text-gold/30 tracking-wider uppercase">Watches</div><div id="stat-watches" class="text-sm font-bold text-gold">—</div></div>
        <div class="bg-card border border-gold/[0.04] rounded p-3"><div class="text-[10px] text-gold/30 tracking-wider uppercase">Vehicles</div><div id="stat-vehicles" class="text-sm font-bold text-gold">—</div></div>
      </div>

      {/* Table */}
      <div class="bg-card border border-gold/[0.04] rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead class="bg-surface">
              <tr class="text-left text-gold/25 uppercase tracking-wider">
                <th class="px-3 py-2">Item</th><th class="px-3 py-2">Cat</th><th class="px-3 py-2">Cond</th><th class="px-3 py-2">Value</th><th class="px-3 py-2">Conf</th><th class="px-3 py-2">Status</th><th class="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody id="inventory-tbody">
              <tr><td colspan={7} class="px-3 py-10 text-center text-white/10"><i class="fas fa-spinner fa-spin text-lg mb-1 block"></i></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <div id="add-item-modal" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onclick="if(event.target===this){this.classList.add('hidden')}">
        <div class="bg-card border border-gold/[0.06] rounded-lg p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h2 class="text-sm font-semibold text-gold mb-3 tracking-wider uppercase">Add Item</h2>
          <form id="add-item-form" class="space-y-2.5">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Category</label>
                <select name="category" required class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-gold/30 transition-all">
                  <option value="">—</option><option>Watches</option><option>Handbags</option><option>Fine Jewelry</option><option>Art & Collectibles</option><option>Luxury Vehicles</option>
                </select>
              </div>
              <div>
                <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Brand</label>
                <input name="brand" required placeholder="Rolex" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/10 focus:outline-none focus:border-gold/30 transition-all" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Model</label>
                <input name="model" required placeholder="Submariner" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/10 focus:outline-none focus:border-gold/30 transition-all" />
              </div>
              <div>
                <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Ref</label>
                <input name="reference_number" placeholder="126610LN" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/10 focus:outline-none focus:border-gold/30 transition-all" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Value USD</label>
                <input name="estimated_value" type="number" min="0" step="0.01" placeholder="0" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/10 focus:outline-none focus:border-gold/30 transition-all" />
              </div>
              <div>
                <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Grade 0-4</label>
                <input name="condition_grade" type="number" min="0" max="4" value="3" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-gold/30 transition-all" />
              </div>
            </div>
            <div>
              <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Condition</label>
              <input name="condition_label" placeholder="Excellent" value="Good" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/10 focus:outline-none focus:border-gold/30 transition-all" />
            </div>
            <div>
              <label class="block text-[10px] text-white/20 mb-0.5 tracking-wider uppercase">Year</label>
              <input name="year" type="number" min="1900" max="2026" class="w-full bg-surface border border-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-gold/30 transition-all" />
            </div>
            <button type="submit" class="w-full bg-gold hover:bg-gold-light text-black font-semibold py-2 rounded text-xs transition-all">Save</button>
          </form>
        </div>
      </div>

      {/* Detail Modal */}
      <div id="detail-modal" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onclick="if(event.target===this){this.classList.add('hidden')}">
        <div class="bg-card border border-gold/[0.06] rounded-lg p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div id="detail-content"></div>
        </div>
      </div>
    </Layout>
  )
}
