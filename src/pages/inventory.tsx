import { Layout } from './layout'

export function InventoryPage() {
  return (
    <Layout title="Authenticated Inventory — CuratedLux" active="inventory">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-serif font-bold text-white mb-1">Authenticated Inventory</h1>
          <p class="text-white/50">Browse, manage, and track authenticated luxury assets.</p>
        </div>
        <button onclick="document.getElementById('add-item-modal').classList.remove('hidden')"
          class="bg-gold hover:bg-gold-dark text-black font-semibold px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2 text-sm">
          <i class="fas fa-plus"></i> Add Item
        </button>
      </div>

      {/* Filters */}
      <div class="flex flex-wrap gap-3 mb-6">
        <select id="filter-category"
          class="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50">
          <option value="">All Categories</option>
          <option>Watches</option>
          <option>Handbags</option>
          <option>Fine Jewelry</option>
          <option>Art & Collectibles</option>
          <option>Luxury Vehicles</option>
        </select>
        <input id="filter-brand" type="text" placeholder="Brand..."
          class="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50 w-32" />
        <select id="filter-status"
          class="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50">
          <option value="active">Active</option>
          <option value="">All Status</option>
          <option value="locked">Locked</option>
          <option value="sold">Sold</option>
          <option value="archived">Archived</option>
        </select>
        <button id="filter-btn"
          class="border border-white/10 hover:border-white/20 text-white/70 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors">
          <i class="fas fa-filter mr-1"></i> Apply
        </button>
        <span id="filter-count" class="text-white/30 text-sm self-center ml-2"></span>
      </div>

      {/* Stats Bar */}
      <div id="stats-bar" class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div class="bg-card border border-border rounded-lg p-4"><div class="text-xs text-white/40">Total Items</div><div id="stat-total" class="text-xl font-bold text-white">—</div></div>
        <div class="bg-card border border-border rounded-lg p-4"><div class="text-xs text-white/40">Total Value</div><div id="stat-value" class="text-xl font-bold text-gold">—</div></div>
        <div class="bg-card border border-border rounded-lg p-4"><div class="text-xs text-white/40">Watches</div><div id="stat-watches" class="text-xl font-bold text-white">—</div></div>
        <div class="bg-card border border-border rounded-lg p-4"><div class="text-xs text-white/40">Vehicles</div><div id="stat-vehicles" class="text-xl font-bold text-white">—</div></div>
      </div>

      {/* Table */}
      <div class="bg-card border border-border rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-surface">
              <tr class="text-left text-white/40 text-xs uppercase tracking-wider">
                <th class="px-5 py-3">Item</th>
                <th class="px-5 py-3">Category</th>
                <th class="px-5 py-3">Condition</th>
                <th class="px-5 py-3">Value</th>
                <th class="px-5 py-3">Confidence</th>
                <th class="px-5 py-3">Status</th>
                <th class="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody id="inventory-tbody">
              <tr><td colspan={7} class="px-5 py-12 text-center text-white/20">
                <i class="fas fa-spinner fa-spin text-2xl mb-2 block"></i>Loading inventory...
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      <div id="add-item-modal" class="hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onclick="if(event.target===this){this.classList.add('hidden')}">
        <div class="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <h2 class="text-lg font-semibold text-white mb-4">Add Inventory Item</h2>
          <form id="add-item-form" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-white/40 mb-1">Category *</label>
                <select name="category" required class="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50">
                  <option value="">Select...</option><option>Watches</option><option>Handbags</option><option>Fine Jewelry</option><option>Art & Collectibles</option><option>Luxury Vehicles</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-white/40 mb-1">Brand *</label>
                <input name="brand" required placeholder="e.g., Rolex" class="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-white/40 mb-1">Model *</label>
                <input name="model" required placeholder="e.g., Submariner" class="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50" />
              </div>
              <div>
                <label class="block text-xs text-white/40 mb-1">Reference Number</label>
                <input name="reference_number" placeholder="e.g., 126610LN" class="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-white/40 mb-1">Estimated Value (USD)</label>
                <input name="estimated_value" type="number" min="0" step="0.01" placeholder="0" class="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50" />
              </div>
              <div>
                <label class="block text-xs text-white/40 mb-1">Condition Grade (0-4)</label>
                <input name="condition_grade" type="number" min="0" max="4" value="3" class="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50" />
              </div>
            </div>
            <div>
              <label class="block text-xs text-white/40 mb-1">Condition Label</label>
              <input name="condition_label" placeholder="e.g., Excellent" value="Good" class="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50" />
            </div>
            <div>
              <label class="block text-xs text-white/40 mb-1">Year</label>
              <input name="year" type="number" min="1900" max="2026" class="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50" />
            </div>
            <button type="submit" class="w-full bg-gold hover:bg-gold-dark text-black font-semibold py-2.5 rounded-lg transition-colors text-sm">Save Item</button>
          </form>
        </div>
      </div>

      {/* Detail Modal */}
      <div id="detail-modal" class="hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onclick="if(event.target===this){this.classList.add('hidden')}">
        <div class="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div id="detail-content"></div>
        </div>
      </div>
    </Layout>
  )
}
