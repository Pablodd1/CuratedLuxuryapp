import { html } from 'hono/html'

export function Layout({ title, active, children }: { title: string; active: string; children: any }) {
  const navLinks = [
    { href: '/', label: 'Home', icon: 'fa-house' },
    { href: '/valuation', label: 'Valuation', icon: 'fa-camera' },
    { href: '/inventory', label: 'Inventory', icon: 'fa-boxes' },
    { href: '/requests', label: 'Requests', icon: 'fa-magnifying-glass' },
    { href: '/matching', label: 'Matching', icon: 'fa-code-branch' },
  ]

  return (
    <>
      {html`<!DOCTYPE html>`}
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <meta name="description" content="CuratedLux — AI-powered luxury asset valuation, authentication, and client-dealer matching platform." />
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="icon" href="/static/favicon.svg" type="image/svg+xml" />
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
        <link href="/static/style.css" rel="stylesheet" />
        <script>{html`
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  gold: '#c8a45a',
                  'gold-dark': '#a6853a',
                  'gold-light': '#e0c680',
                  surface: '#0d0d0d',
                  card: '#141414',
                  border: '#1f1f1f',
                },
                fontFamily: { serif: ['Georgia', 'Palatino', 'serif'], mono: ['JetBrains Mono', 'Fira Code', 'monospace'] }
              }
            }
          }
        `}</script>
        <style>{`
          body { background: #0a0a0a; color: #e5e5e5; }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: #0a0a0a; }
          ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: #3a3a3a; }
        `}</style>
      </head>
      <body class="antialiased min-h-screen flex flex-col">
        {/* Navigation */}
        <nav class="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <a href="/" class="flex items-center gap-2.5 group">
              <div class="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center group-hover:bg-gold/25 transition-colors">
                <i class="fas fa-gem text-gold text-sm"></i>
              </div>
              <span class="font-serif font-bold text-white text-lg tracking-tight">
                Curated<span class="text-gold">Lux</span>
              </span>
            </a>
            <div class="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <a href={link.href}
                  class={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active === link.label.toLowerCase()
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                  }`}>
                  <i class={`fas ${link.icon} mr-1.5 text-xs opacity-60`}></i>
                  {link.label}
                </a>
              ))}
            </div>
            {/* Mobile nav */}
            <div class="md:hidden flex items-center gap-2">
              <a href="/valuation" class="bg-gold hover:bg-gold-dark text-black text-xs font-semibold px-3 py-1.5 rounded-md transition-colors">
                <i class="fas fa-camera mr-1"></i>Scan
              </a>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main class="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {children}
        </main>

        {/* Footer */}
        <footer class="border-t border-white/[0.06] py-6 text-white/30 text-xs">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between gap-2">
            <span>CuratedLux v2.0 — AI-Powered Luxury Asset Intelligence. Edge-native on Cloudflare.</span>
            <span>&copy; {new Date().getFullYear()} CuratedLux. All valuations are AI-assisted estimates.</span>
          </div>
        </footer>

        {/* Global Scripts */}
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
      </body>
      </html>
    </>
  )
}
