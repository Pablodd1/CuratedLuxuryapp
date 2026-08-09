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
                  surface: '#0d0d0d',
                  card: '#141414',
                  border: '#1f1f1f',
                },
                fontFamily: { mono: ['JetBrains Mono', 'Fira Code', 'monospace'] }
              }
            }
          }
        `}</script>
        <style>{`
          body { background: #0a0a0a; color: #e5e5e5; }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: #0a0a0a; }
          ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
        `}</style>
      </head>
      <body class="antialiased min-h-screen flex flex-col">
        <nav class="sticky top-0 z-50 bg-surface/90 border-b border-white/[0.06]">
          <div class="max-w-7xl mx-auto px-4 flex items-center h-12">
            <div class="flex items-center gap-0.5">
              {tabs.map(tab => (
                <a href={tab.href}
                  class={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    active === tab.label.toLowerCase()
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/40 hover:text-white/70'
                  }`}>
                  <i class={`fas ${tab.icon} mr-1 text-[10px] opacity-50`}></i>
                  {tab.label}
                </a>
              ))}
            </div>
          </div>
        </nav>
        <main class="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
          {children}
        </main>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
      </body>
      </html>
    </>
  )
}
