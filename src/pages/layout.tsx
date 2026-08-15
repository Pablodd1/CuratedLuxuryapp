import { html } from 'hono/html'

export function Layout({ title, active, children, embed = false }: { title: string; active: string; children: any; embed?: boolean }) {
  const tabs = [
    { href: '/valuation', label: 'Scan', icon: 'fa-camera' },
    { href: '/inventory', label: 'Items', icon: 'fa-boxes' },
    { href: '/requests', label: 'Requests', icon: 'fa-magnifying-glass' },
    { href: '/matching', label: 'Match', icon: 'fa-code-branch' },
    { href: '/dossier', label: 'Dossiers', icon: 'fa-file-certificate' },
    { href: '/history', label: 'History', icon: 'fa-clock-rotate-left' },
  ]

  return (
    <>
      {html`<!DOCTYPE html>`}
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/static/favicon.svg" type="image/svg+xml" />
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
        <link href="/static/style.css" rel="stylesheet" />
        <script>{html`
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  gold: '#d4af37',
                  'gold-light': '#e8c84a',
                  'gold-dark': '#b8960c',
                  'gold-dim': '#8b7300',
                  surface: '#080808',
                  card: '#0e0e0e',
                  border: '#1a1a1a',
                },
                fontFamily: { mono: ['JetBrains Mono', 'Fira Code', 'monospace'] }
              }
            }
          }
        `}</script>
        <style>{`
          body { background: #050505; color: #d1d1d1; background-image: radial-gradient(ellipse at 50% 0%, rgba(180,150,30,0.04) 0%, transparent 60%); background-attachment: fixed; }
          ::-webkit-scrollbar { width: 5px; }
          ::-webkit-scrollbar-track { background: #050505; }
          ::-webkit-scrollbar-thumb { background: #222; border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: #333; }
          body.embed-mode { background: transparent; background-image: none; }
          body.embed-mode main { padding-top: 0.5rem; }
        `}</style>
        {embed && (
          <script>{html`
            // ── PostMessage bridge for embed parents (Squarespace, Versatile, watchfact.com)
            (function() {
              const ALLOWED_ORIGINS = []; // empty = allow all (parent sets via setAllowed)
              let allowedAll = true;

              function resize() {
                const h = Math.max(
                  document.body.scrollHeight,
                  document.documentElement.scrollHeight,
                  document.body.offsetHeight
                );
                const payload = { type: 'clx:resize', height: h, width: window.innerWidth };
                if (window.parent !== window) {
                  window.parent.postMessage(payload, '*');
                }
              }

              window.addEventListener('message', (e) => {
                if (!e.data || typeof e.data !== 'object') return;
                if (e.data.type === 'clx:configure') {
                  if (Array.isArray(e.data.allowedOrigins)) {
                    ALLOWED_ORIGINS.length = 0;
                    ALLOWED_ORIGINS.push(...e.data.allowedOrigins);
                    allowedAll = e.data.allowedAll === true;
                  }
                }
                if (e.data.type === 'clx:ping') {
                  const reply = { type: 'clx:pong', ready: true, version: (window.CLX_VERSION || '2.0.0'), embed: true };
                  e.source?.postMessage(reply, '*');
                }
                if (e.data.type === 'clx:requestResult') {
                  const detail = { type: 'clx:result', payload: window._clxLastResult || null };
                  e.source?.postMessage(detail, '*');
                }
              });

              // Expose a hook so the app can announce valuation results to the parent
              window.clxNotifyParent = function(result) {
                window._clxLastResult = result;
                if (window.parent !== window) {
                  window.parent.postMessage({ type: 'clx:scanCompleted', result }, '*');
                }
              };

              // Observe DOM mutations and report height changes to parent
              const observer = new ResizeObserver(resize);
              observer.observe(document.body);
              window.addEventListener('load', resize);
              window.addEventListener('resize', resize);
              setTimeout(resize, 100);
              setTimeout(resize, 500);

              // Announce ready
              if (window.parent !== window) {
                window.parent.postMessage({ type: 'clx:ready', version: window.CLX_VERSION || '2.0.0', embed: true }, '*');
              }
            })();
          `}</script>
        )}
      </head>
      <body class={`antialiased min-h-screen flex flex-col${embed ? ' embed-mode' : ''}`}>
        {!embed && (
          <nav class="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gold/[0.06]">
            <div class="max-w-7xl mx-auto px-4 flex items-center justify-between h-11">
              <div class="flex items-center min-w-0">
                <button onclick="clxGoBack()"
                  class="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-gold transition-colors mr-3 shrink-0"
                  title="Back to original site">
                  <i class="fas fa-arrow-left text-[10px]"></i>
                  <span class="hidden sm:inline">Back</span>
                </button>
                <a href="/valuation" class="text-gold font-semibold tracking-widest text-xs mr-4 uppercase shrink-0">
                  CuratedLux
                </a>
                <div class="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
                  {tabs.map(tab => (
                    <a href={tab.href}
                      class={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                        active === tab.label.toLowerCase()
                          ? 'bg-gold/[0.08] text-gold'
                          : 'text-white/30 hover:text-white/60'
                      }`}>
                      <i class={`fas ${tab.icon} mr-1 text-[10px] opacity-60`}></i>
                      {tab.label}
                    </a>
                  ))}
                </div>
              </div>
              <div class="flex items-center gap-3 shrink-0">
                <a href="/history" class="text-[11px] text-white/30 hover:text-white/60 whitespace-nowrap">
                  <i class="fas fa-clock-rotate-left mr-1"></i><span class="hidden sm:inline">History</span>
                </a>
                <a href="/account" class="text-[11px] text-white/30 hover:text-white/60 whitespace-nowrap">
                  <i class="fas fa-user mr-1"></i><span class="hidden sm:inline">Account</span>
                </a>
              </div>
            </div>
          </nav>
        )}
        {embed && (
          <div class="clx-embed-bar bg-black/40 backdrop-blur-sm border-b border-gold/10 px-4 py-1.5 flex items-center justify-between text-[10px] font-mono">
            <button onclick="clxGoBack()" class="text-gold/80 hover:text-gold transition-colors flex items-center gap-1">
              <i class="fas fa-arrow-left"></i> Back to site
            </button>
            <span class="text-white/30">press Esc to exit</span>
          </div>
        )}
        <script>{html`
          window.clxGoBack = function () {
            // Embedded in an iframe → tell the parent to close/surrender the frame
            if (window.parent !== window) {
              try { window.parent.postMessage({ type: 'clx:exit' }, '*'); } catch (e) {}
            }
            // Then fall back to history, else the original site
            if (document.referrer && document.referrer !== location.href) {
              try { if (history.length > 1) { history.back(); return; } } catch (e) {}
            }
            location.href = 'https://watchfact.com';
          };
        `}</script>
        <main class={`flex-1 max-w-7xl mx-auto px-4 py-5 w-full${embed ? ' embed-main' : ''}`}>
          {children}
        </main>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
        {embed && (
          <script>{html`
            // Esc exits embed mode
            document.addEventListener('keydown', (e) => {
              if (e.key === 'Escape' && window.parent !== window) {
                window.parent.postMessage({ type: 'clx:exit' }, '*');
              }
            });
          `}</script>
        )}
      </body>
      </html>
    </>
  )
}
