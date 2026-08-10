import { Layout } from './layout'

export function HistoryPage() {
  return (
    <Layout title="History · CuratedLux" active="history">
      <div class="max-w-6xl mx-auto py-4">
        <header class="mb-6">
          <h1 class="text-2xl font-serif font-bold text-gold">
            <i class="fas fa-clock-rotate-left mr-2 opacity-70"></i>Scan History
          </h1>
          <p class="text-white/40 text-sm mt-1">Every asset you've authenticated, in one place.</p>
        </header>

        <section class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-card border border-gold/[0.08] rounded-xl p-5">
            <div class="text-xs text-white/40 mb-1 uppercase tracking-wider">Total Scans</div>
            <div id="stat-total" class="text-2xl font-bold font-mono text-gold">—</div>
          </div>
          <div class="bg-card border border-gold/[0.08] rounded-xl p-5">
            <div class="text-xs text-white/40 mb-1 uppercase tracking-wider">Portfolio Value</div>
            <div id="stat-value" class="text-2xl font-bold font-mono text-gold">—</div>
          </div>
          <div class="bg-card border border-gold/[0.08] rounded-xl p-5">
            <div class="text-xs text-white/40 mb-1 uppercase tracking-wider">Authentic</div>
            <div id="stat-authentic" class="text-2xl font-bold font-mono text-gold">—</div>
          </div>
        </section>

        <div class="mb-4 flex items-center gap-2">
          <input id="filter-input" type="text" placeholder="Filter by brand, model, or reference…"
            class="flex-1 bg-black/30 border border-white/[0.06] rounded px-3 py-2 text-sm text-white placeholder-white/20 focus:border-gold/50 focus:outline-none" />
          <select id="filter-source" class="bg-black/30 border border-white/[0.06] rounded px-3 py-2 text-sm text-white/70 focus:border-gold/50 focus:outline-none">
            <option value="">All sources</option>
            <option value="camera">Camera</option>
            <option value="voice">Voice</option>
            <option value="manual">Manual</option>
            <option value="embed">Embed</option>
          </select>
        </div>

        <div id="scans-table" class="bg-card border border-gold/[0.08] rounded-xl overflow-hidden">
          <div class="px-5 py-12 text-center text-white/20">
            <i class="fas fa-spinner fa-spin text-2xl mb-3 block"></i>Loading scans…
          </div>
        </div>

        <script>{`
          let allScans = [];
          async function load() {
            const r = await fetch('/api/history?limit=200', { credentials: 'include' });
            if (r.status === 401) {
              document.getElementById('scans-table').innerHTML =
                '<div class="px-5 py-12 text-center text-white/40"><i class="fas fa-user-lock text-3xl mb-3 block"></i>Sign in to view your history.<br><a href="/login" class="text-gold hover:text-gold-light">Sign in →</a></div>';
              return;
            }
            const j = await r.json();
            allScans = j.scans || [];
            render();
          }
          function render() {
            const filter = (document.getElementById('filter-input').value || '').toLowerCase();
            const source = document.getElementById('filter-source').value;
            const filtered = allScans.filter(s => {
              if (source && s.source !== source) return false;
              if (filter) {
                const hay = ((s.brand || '') + ' ' + (s.model || '') + ' ' + (s.reference_number || '')).toLowerCase();
                if (!hay.includes(filter)) return false;
              }
              return true;
            });

            document.getElementById('stat-total').textContent = allScans.length;
            const value = allScans.reduce((a, s) => a + (s.estimated_value || 0), 0);
            document.getElementById('stat-value').textContent = fmtCurrency(value);
            document.getElementById('stat-authentic').textContent = allScans.filter(s => s.authenticity_status === 'AUTHENTIC MATCH').length;

            const table = document.getElementById('scans-table');
            if (filtered.length === 0) {
              table.innerHTML = '<div class="px-5 py-12 text-center text-white/20"><i class="fas fa-inbox text-3xl mb-2 block opacity-20"></i>No scans match</div>';
              return;
            }
            table.innerHTML = filtered.map(s => \`
              <div class="px-5 py-4 border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0 flex-1">
                    <div class="font-medium text-white truncate">\${escapeHtml(s.brand || 'Unknown')} \${escapeHtml(s.model || '')}</div>
                    <div class="text-xs text-white/30 truncate">
                      \${escapeHtml(s.category || '—')}
                      \${s.reference_number ? ' · Ref: ' + escapeHtml(s.reference_number) : ''}
                      \${s.year ? ' · ' + s.year : ''}
                    </div>
                    <div class="text-xs text-white/20 mt-1">
                      <i class="fas fa-calendar mr-1"></i>\${new Date(s.created_at).toLocaleString()}
                      <span class="mx-2 text-white/10">·</span>
                      <i class="fas fa-\${sourceIcon(s.source)} mr-1"></i>\${s.source || 'manual'}
                      \${s.image_count > 0 ? \`<span class="mx-2 text-white/10">·</span><i class="fas fa-image mr-1"></i>\${s.image_count} images\` : ''}
                    </div>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <div class="text-lg font-bold font-mono text-gold">\${fmtCurrency(s.estimated_value)}</div>
                    <div class="text-xs text-white/30 font-mono">\${s.confidence || 0}% conf</div>
                    <span class="inline-flex items-center gap-1 px-2 mt-1 rounded-full text-[10px] font-medium border \${
                      s.authenticity_status === 'AUTHENTIC MATCH' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      s.authenticity_status === 'REQUIRES IN-PERSON VERIFICATION' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      s.authenticity_status === 'PENDING' ? 'bg-white/5 text-white/40 border-white/10' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }">\${escapeHtml(s.authenticity_status || 'PENDING')}</span>
                  </div>
                </div>
              </div>
            \`).join('');
          }
          function sourceIcon(s) {
            return ({ camera: 'camera', voice: 'microphone', embed: 'code', manual: 'pen' })[s] || 'pen';
          }
          function fmtCurrency(n) {
            if (!n || n === 0) return '$0';
            if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
            if (n >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K';
            return '$' + Number(n).toLocaleString('en-US');
          }
          function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
          document.getElementById('filter-input').addEventListener('input', render);
          document.getElementById('filter-source').addEventListener('change', render);
          load();
        `}</script>
      </div>
    </Layout>
  )
}
