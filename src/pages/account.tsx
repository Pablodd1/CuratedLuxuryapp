import { Layout } from './layout'

export function AccountPage() {
  return (
    <Layout title="Account · CuratedLux" active="account">
      <div class="max-w-4xl mx-auto py-6">
        <header class="mb-6">
          <h1 class="text-2xl font-serif font-bold text-gold">
            <i class="fas fa-gem mr-2 opacity-70"></i>Account
          </h1>
          <p class="text-white/40 text-sm mt-1">Your scan history, API credentials, and webhook integrations.</p>
        </header>

        <section id="account-profile" class="bg-card border border-gold/[0.08] rounded-xl p-6 mb-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-gold uppercase tracking-wider">Profile</h2>
            <button id="logout-btn" class="text-xs text-white/30 hover:text-red-400 transition-colors">
              <i class="fas fa-arrow-right-from-bracket mr-1"></i>Sign out
            </button>
          </div>
          <div id="profile-content">
            <div class="animate-pulse space-y-2">
              <div class="h-4 bg-white/[0.06] rounded w-1/3"></div>
              <div class="h-3 bg-white/[0.06] rounded w-1/2"></div>
              <div class="h-3 bg-white/[0.06] rounded w-1/4"></div>
            </div>
          </div>
        </section>

        <section class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div class="bg-card border border-gold/[0.08] rounded-xl p-5">
            <div class="text-xs text-white/40 mb-1 uppercase tracking-wider">Total Scans</div>
            <div id="stat-scans" class="text-2xl font-bold font-mono text-gold">—</div>
          </div>
          <div class="bg-card border border-gold/[0.08] rounded-xl p-5">
            <div class="text-xs text-white/40 mb-1 uppercase tracking-wider">Portfolio Value</div>
            <div id="stat-value" class="text-2xl font-bold font-mono text-gold">—</div>
          </div>
          <div class="bg-card border border-gold/[0.08] rounded-xl p-5">
            <div class="text-xs text-white/40 mb-1 uppercase tracking-wider">Last Seen</div>
            <div id="stat-seen" class="text-sm text-white/60 font-mono">—</div>
          </div>
        </section>

        <section class="bg-card border border-gold/[0.08] rounded-xl p-6 mb-5">
          <h2 class="text-sm font-semibold text-gold uppercase tracking-wider mb-4">
            <i class="fas fa-key mr-2 text-xs"></i>API Token
          </h2>
          <p class="text-xs text-white/50 mb-3">
            Long-lived bearer token for embed integrations, custom frontends, and webhook signing.
            Keep it secret.
          </p>
          <div class="flex items-center gap-2">
            <code id="api-token" class="flex-1 bg-black/40 border border-white/[0.06] rounded px-3 py-2 text-xs text-white/80 font-mono truncate">•••••••••••••••</code>
            <button id="reveal-token" class="text-xs text-gold hover:text-gold-light">
              <i class="fas fa-eye mr-1"></i>Reveal
            </button>
            <button id="copy-token" class="text-xs text-gold hover:text-gold-light">
              <i class="fas fa-copy mr-1"></i>Copy
            </button>
          </div>
        </section>

        <section class="bg-card border border-gold/[0.08] rounded-xl p-6 mb-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-gold uppercase tracking-wider">
              <i class="fas fa-broadcast-tower mr-2 text-xs"></i>Webhook Endpoints
            </h2>
            <button id="new-webhook-btn" class="text-xs bg-gold/10 text-gold hover:bg-gold/20 px-3 py-1.5 rounded transition-colors">
              <i class="fas fa-plus mr-1"></i>New
            </button>
          </div>
          <div id="webhooks-list" class="space-y-2">
            <div class="text-xs text-white/30 italic">Loading…</div>
          </div>
        </section>

        <section class="bg-card border border-gold/[0.08] rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-gold uppercase tracking-wider">
              <i class="fas fa-clock-rotate-left mr-2 text-xs"></i>Recent Scans
            </h2>
            <a href="/history" class="text-xs text-gold hover:text-gold-light">View all →</a>
          </div>
          <div id="recent-scans" class="space-y-2">
            <div class="text-xs text-white/30 italic">Loading…</div>
          </div>
        </section>

        <script>{`
          let apiToken = null;

          async function loadAccount() {
            const me = await fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json());
            if (!me.authenticated) {
              window.location.href = '/login';
              return;
            }
            const u = me.user;
            apiToken = u.api_token;
            const pc = document.getElementById('profile-content');
            pc.innerHTML = \`
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <div class="text-xs text-white/40">Display name</div>
                  <div class="text-white font-medium">\${u.display_name || '—'}</div>
                </div>
                <div>
                  <div class="text-xs text-white/40">Email</div>
                  <div class="text-white font-mono text-sm">\${u.email}</div>
                </div>
                <div>
                  <div class="text-xs text-white/40">Role</div>
                  <div class="text-xs uppercase tracking-wider text-gold">\${u.role || 'user'}</div>
                </div>
                <div>
                  <div class="text-xs text-white/40">Created</div>
                  <div class="text-white text-sm">\${new Date(u.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            \`;

            const stats = await fetch('/api/history/stats', { credentials: 'include' }).then(r => r.json()).catch(() => ({}));
            document.getElementById('stat-scans').textContent = stats.totalScans || 0;
            document.getElementById('stat-value').textContent = fmtCurrency(stats.portfolioValue || 0);
            document.getElementById('stat-seen').textContent = u.last_seen_at ? new Date(u.last_seen_at).toLocaleString() : 'Now';

            const tokenEl = document.getElementById('api-token');
            document.getElementById('reveal-token').onclick = () => {
              tokenEl.textContent = apiToken || '—';
              tokenEl.classList.remove('text-white/80');
              tokenEl.classList.add('text-gold');
            };
            document.getElementById('copy-token').onclick = () => {
              navigator.clipboard.writeText(apiToken || '');
              const b = document.getElementById('copy-token');
              b.textContent = '✓ Copied';
              setTimeout(() => b.innerHTML = '<i class="fas fa-copy mr-1"></i>Copy', 1500);
            };

            loadWebhooks();
            loadRecentScans();
          }

          async function loadWebhooks() {
            const list = document.getElementById('webhooks-list');
            try {
              const r = await fetch('/api/webhooks', { credentials: 'include' });
              if (r.status === 401) { list.innerHTML = '<div class="text-xs text-white/30 italic">Sign in to manage webhooks</div>'; return; }
              const j = await r.json();
              const ws = j.webhooks || [];
              if (ws.length === 0) {
                list.innerHTML = '<div class="text-xs text-white/30 italic">No webhooks yet. Click "+ New" to add one.</div>';
                return;
              }
              list.innerHTML = ws.map(w => \`
                <div class="bg-surface border border-white/[0.05] rounded-lg p-3 flex items-center justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="text-sm text-white truncate">\${escapeHtml(w.name)}</div>
                    <div class="text-xs text-white/30 font-mono truncate">\${escapeHtml(w.target_url)}</div>
                    <div class="text-[10px] text-white/20 mt-1">events: \${escapeHtml(w.event_types)}</div>
                  </div>
                  <div class="flex gap-1 flex-shrink-0">
                    <button data-id="\${w.id}" class="test-wh text-xs text-gold hover:text-gold-light px-2 py-1">Test</button>
                    <button data-id="\${w.id}" class="del-wh text-xs text-red-400 hover:text-red-300 px-2 py-1">Delete</button>
                  </div>
                </div>
              \`).join('');
              document.querySelectorAll('.test-wh').forEach(b => b.onclick = () => testWebhook(b.dataset.id));
              document.querySelectorAll('.del-wh').forEach(b => b.onclick = () => deleteWebhook(b.dataset.id));
            } catch (e) {
              list.innerHTML = '<div class="text-xs text-red-400">Failed to load webhooks</div>';
            }
          }

          async function testWebhook(id) {
            try {
              const r = await fetch('/api/webhooks/' + id + '/test', { method: 'POST', credentials: 'include' });
              const j = await r.json();
              alert('Test delivery:\\nHTTP ' + j.status + '\\nDelivered: ' + j.delivered + '\\nResponse: ' + (j.response || '').slice(0, 300));
            } catch (e) { alert('Test failed: ' + e.message); }
          }

          async function deleteWebhook(id) {
            if (!confirm('Delete this webhook?')) return;
            await fetch('/api/webhooks/' + id, { method: 'DELETE', credentials: 'include' });
            loadWebhooks();
          }

          async function loadRecentScans() {
            const list = document.getElementById('recent-scans');
            try {
              const r = await fetch('/api/history?limit=5', { credentials: 'include' });
              if (r.status === 401) { list.innerHTML = '<div class="text-xs text-white/30 italic">Sign in</div>'; return; }
              const j = await r.json();
              const scans = j.scans || [];
              if (scans.length === 0) {
                list.innerHTML = '<div class="text-xs text-white/30 italic">No scans yet. Try the scanner →</div>';
                return;
              }
              list.innerHTML = scans.map(s => \`
                <div class="bg-surface border border-white/[0.05] rounded-lg p-3 flex items-center justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="text-sm text-white truncate">\${escapeHtml(s.brand || 'Unknown')} \${escapeHtml(s.model || '')}</div>
                    <div class="text-xs text-white/30">\${escapeHtml(s.category || '—')} · \${new Date(s.created_at).toLocaleDateString()}</div>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <div class="text-sm font-mono text-gold">\${fmtCurrency(s.estimated_value)}</div>
                    <div class="text-[10px] text-white/30">\${s.confidence}% conf</div>
                  </div>
                </div>
              \`).join('');
            } catch (e) {
              list.innerHTML = '<div class="text-xs text-red-400">Failed to load scans</div>';
            }
          }

          function fmtCurrency(n) {
            if (!n || n === 0) return '$0';
            if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
            if (n >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K';
            return '$' + Number(n).toLocaleString('en-US');
          }
          function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

          document.getElementById('logout-btn').onclick = async () => {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            window.location.href = '/login';
          };
          document.getElementById('new-webhook-btn').onclick = () => {
            const url = prompt('Webhook target URL (https://...):');
            if (!url) return;
            const name = prompt('Webhook name:', 'My endpoint');
            if (!name) return;
            const events = prompt('Events to subscribe (comma-separated, or *):', 'scan.created');
            if (!events) return;
            fetch('/api/webhooks', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, target_url: url, event_types: events.split(',').map(s => s.trim()).join(',') }),
            }).then(r => r.json()).then(j => {
              if (j.webhook) {
                prompt('Copy your signing secret (you will NOT see it again):', j.signing_secret);
                loadWebhooks();
              } else {
                alert('Failed: ' + (j.error || JSON.stringify(j)));
              }
            });
          };

          loadAccount();
        `}</script>
      </div>
    </Layout>
  )
}
