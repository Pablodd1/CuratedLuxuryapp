import { html } from 'hono/html'

export function Layout({ title, active, children }: { title: string; active: string; children: any }) {
  const tabs = [
    { href: '/valuation', label: 'Scan', icon: 'fa-camera' },
    { href: '/inventory', label: 'Items', icon: 'fa-boxes' },
    { href: '/requests', label: 'Requests', icon: 'fa-magnifying-glass' },
    { href: '/matching', label: 'Match', icon: 'fa-code-branch' },
    { href: '/dossier', label: 'Dossiers', icon: 'fa-file-certificate' },
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
        `}</style>
      </head>
      <body class="antialiased min-h-screen flex flex-col">
        <nav class="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gold/[0.06]">
          <div class="max-w-7xl mx-auto px-4 flex items-center h-11">
            <a href="/valuation" class="text-gold font-semibold tracking-widest text-xs mr-4 uppercase">CuratedLux</a>
            <div class="flex items-center gap-0.5">
              {tabs.map(tab => (
                <a href={tab.href}
                  class={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${
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
        </nav>
        <main class="flex-1 max-w-7xl mx-auto px-4 py-5 w-full">
          {children}
        </main>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
      </body>
      </html>
    </>
  )
}
