import { Layout } from './layout'

export function InventoryPage() {
  return (
    <Layout title="Items" active="items">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-sm font-medium text-white/60">Inventory</h1>
        <button onclick="document.getElementById('add-item-modal').classList.remove('hidden')"
          class="bg-white hover:bg-white/90 text-black font-medium px-3 py-1.5 rounded text-xs transition-colors inline-flex items-center gap-1.5">
          <i class="fas fa-plus text-[10px]"></i> Add
        </button>
      </div>

      {/* Filters */}
      <div class="flex flex-wrap gap-2 mb-4">
        <select id="filter-category" class="bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/20">
          <option value="">All</option>
          <option>Watches</option><option>Handbags</option><option>Fine Jewelry</option><option>Art & Collectibles</option><option>Luxury Vehicles</option>
        </select>
        <input id="filter-brand" type="text" placeholder="Brand" class="bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/20 w-20" />
        <select id="filter-status" class="bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/20">
          <option value="active">Active</option><option value="">All</option><option value="locked">Locked</option><option value="sold">Sold</option><option value="archived">Archived</option>
        </select>
        <button id="filter-btn" class="border border-white/10 text-white/50 hover:text-white/80 px-2.5 py-1.5 rounded text-xs transition-colors">Filter</button>
        <span id="filter-count" class="text-white/20 text-xs self-center"></span>
      </div>

      {/* Stats */}
      <div id="stats-bar" class="grid grid-cols-4 gap-3 mb-4">
        <div class="bg-card border border-border rounded p-3"><div class="text-[10px] text-white/30">Items</div><div id="stat-total" class="text-sm font-bold text-white">—</div></div>
        <div class="bg-card border border-border rounded p-3"><div class="text-[10px] text-white/30">Value</div><div id="stat-value" class="text-sm font-bold text-white">—</div></div>
        <div class="bg-card border border-border rounded p-3"><div class="text-[10px] text-white/30">Watches</div><div id="stat-watches" class="text-sm font-bold text-white">—</div></div>
        <div class="bg-card border border-border rounded p-3"><div class="text-[10px] text-white/30">Vehicles</div><div id="stat-vehicles" class="text-sm font-bold text-white">—</div></div>
      </div>

      {/* Table */}
      <div class="bg-card border border-border rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead class="bg-surface">
              <tr class="text-left text-white/30 uppercase tracking-wider">
                <th class="px-3 py-2">Item</th><th class="px-3 py-2">Cat</th><th class="px-3 py-2">Cond</th><th class="px-3 py-2">Value</th><th class="px-3 py-2">Conf</th><th class="px-3 py-2">Status</th><th class="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody id="inventory-tbody">
              <tr><td colspan={7} class="px-3 py-10 text-center text-white/15"><i class="fas fa-spinner fa-spin text-lg mb-1 block"></i></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <div id="add-item-modal" class="hidden fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onclick="if(event.target===this){this.classList.add('hidden')}">
        <div class="bg-card border border-border rounded-lg p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h2 class="text-sm font-medium text-white mb-3">Add Item</h2>
          <form id="add-item-form" class="space-y-2.5">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] text-white/30 mb-0.5">Category</label>
                <select name="category" required class="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/20">
                  <option value="">—</option><option>Watches</option><option>Handbags</option><option>Fine Jewelry</option><option>Art & Collectibles</option><option>Luxury Vehicles</option>
                </select>
              </div>
              <div>
                <label class="block text-[10px] text-white/30 mb-0.5">Brand</label>
                <input name="brand" required placeholder="Rolex" class="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-white placeholder-white/15 focus:outline-none focus:border-white/20" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] text-white/30 mb-0.5">Model</label>
                <input name="model" required placeholder="Submariner" class="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-white placeholder-white/15 focus:outline-none focus:border-white/20" />
              </div>
              <div>
                <label class="block text-[10px] text-white/30 mb-0.5">Ref</label>
                <input name="reference_number" placeholder="126610LN" class="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-white placeholder-white/15 focus:outline-none focus:border-white/20" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] text-white/30 mb-0.5">Value USD</label>
                <input name="estimated_value" type="number" min="0" step="0.01" placeholder="0" class="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-white placeholder-white/15 focus:outline-none focus:border-white/20" />
              </div>
              <div>
                <label class="block text-[10px] text-white/30 mb-0.5">Grade 0-4</label>
                <input name="condition_grade" type="number" min="0" max="4" value="3" class="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/20" />
              </div>
            </div>
            <div>
              <label class="block text-[10px] text-white/30 mb-0.5">Condition</label>
              <input name="condition_label" placeholder="Excellent" value="Good" class="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-white placeholder-white/15 focus:outline-none focus:border-white/20" />
            </div>
            <div>
              <label class="block text-[10px] text-white/30 mb-0.5">Year</label>
              <input name="year" type="number" min="1900" max="2026" class="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/20" />
            </div>
            <button type="submit" class="w-full bg-white hover:bg-white/90 text-black font-medium py-2 rounded text-xs transition-colors">Save</button>
          </form>
        </div>
      </div>

      {/* Detail Modal */}
      <div id="detail-modal" class="hidden fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onclick="if(event.target===this){this.classList.add('hidden')}">
        <div class="bg-card border border-border rounded-lg p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div id="detail-content"></div>
        </div>
      </div>
    </Layout>
  )
}
