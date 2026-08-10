import { Layout } from './layout'

/**
 * Embed landing page — explains how external sites (Squarespace, Versatile,
 * watchfact.com, etc.) can drop in the CuratedLux scanner as an iframe.
 */
export function EmbedPage() {
  const code = (origin: string) => `<iframe
  src="${origin}/valuation?embed=1"
  width="100%"
  height="780"
  frameborder="0"
  style="border:0; border-radius:12px; max-width:760px; background:#050505;"
  allow="camera; microphone; autoplay; encrypted-media"
  allowfullscreen
></iframe>`

  return (
    <Layout title="Embed CuratedLux" active="embed" embed>
      <article class="max-w-3xl mx-auto py-2">
        <header class="mb-6">
          <h1 class="text-2xl font-serif font-bold text-gold mb-2">
            <i class="fas fa-code mr-2 opacity-70"></i>Embed CuratedLux
          </h1>
          <p class="text-white/60 text-sm">
            Drop the luxury authentication scanner into Squarespace, Versatile, watchfact.com, or any other site.
            Standalone iframe — no API integration required.
          </p>
        </header>

        <section class="bg-card border border-gold/[0.08] rounded-xl p-5 mb-5">
          <h2 class="text-sm font-semibold text-gold uppercase tracking-wider mb-3">
            <i class="fas fa-link mr-2 text-xs"></i>One-line iframe
          </h2>
          <p class="text-sm text-white/70 mb-3">
            Pastable HTML. Adjust <code class="bg-surface px-1 rounded text-gold">height</code> as needed —
            the iframe auto-grows when results change (<code class="bg-surface px-1 rounded text-gold">postMessage</code> bridge).
          </p>
          <pre class="bg-black/60 border border-white/[0.06] rounded-lg p-4 text-xs text-white/70 overflow-x-auto"><code>{code('https://2db34b16.curatedlux.pages.dev')}</code></pre>
        </section>

        <section class="bg-card border border-gold/[0.08] rounded-xl p-5 mb-5">
          <h2 class="text-sm font-semibold text-gold uppercase tracking-wider mb-3">
            <i class="fas fa-broadcast-tower mr-2 text-xs"></i>postMessage events
          </h2>
          <p class="text-sm text-white/70 mb-3">
            Receive scan results in your parent app — no polling, no server required.
          </p>
          <div class="space-y-2 text-xs font-mono">
            <div class="bg-surface border border-white/[0.05] rounded p-3">
              <div class="text-gold mb-1">clx:ready                    <span class="text-white/30">→ on iframe load</span></div>
              <div class="text-white/50">{`{ type, version, embed }`}</div>
            </div>
            <div class="bg-surface border border-white/[0.05] rounded p-3">
              <div class="text-gold mb-1">clx:scanCompleted            <span class="text-white/30">→ after each scan</span></div>
              <div class="text-white/50">{`{ type, result: { brand, model, estimatedValue, confidence, ... } }`}</div>
            </div>
            <div class="bg-surface border border-white/[0.05] rounded p-3">
              <div class="text-gold mb-1">clx:resize                   <span class="text-white/30">→ as content changes</span></div>
              <div class="text-white/50">{`{ type, height, width }`}</div>
            </div>
            <div class="bg-surface border border-white/[0.05] rounded p-3">
              <div class="text-gold mb-1">clx:ping → clx:pong          <span class="text-white/30">→ handshake</span></div>
              <div class="text-white/50">{`parent sends ping → iframe replies pong`}</div>
            </div>
          </div>
        </section>

        <section class="bg-card border border-gold/[0.08] rounded-xl p-5 mb-5">
          <h2 class="text-sm font-semibold text-gold uppercase tracking-wider mb-3">
            <i class="fas fa-shield mr-2 text-xs"></i>Auto-sizing (no scrollbars)
          </h2>
          <p class="text-sm text-white/70">
            The iframe posts its body height on every resize. Listen on the parent:
          </p>
          <pre class="bg-black/60 border border-white/[0.06] rounded-lg p-4 text-xs text-white/70 overflow-x-auto mt-3"><code>{`window.addEventListener('message', (e) => {
  if (e.data?.type === 'clx:resize') {
    document.getElementById('clx-iframe').style.height = e.data.height + 'px';
  }
  if (e.data?.type === 'clx:scanCompleted') {
    console.log('New scan:', e.data.result);
    // optional: submit to your own backend
  }
});`}</code></pre>
        </section>

        <section class="bg-card border border-gold/[0.08] rounded-xl p-5 mb-5">
          <h2 class="text-sm font-semibold text-gold uppercase tracking-wider mb-3">
            <i class="fas fa-key mr-2 text-xs"></i>Optional: server webhook (oracle-grade)
          </h2>
          <p class="text-sm text-white/70 mb-3">
            Receive signed JSON on your own backend via HMAC-SHA256. Two-way binding for permanent ledger of scans.
          </p>
          <pre class="bg-black/60 border border-white/[0.06] rounded-lg p-4 text-xs text-white/70 overflow-x-auto"><code>{`POST /api/webhooks     { name, target_url, event_types: ["scan.created"] }
POST /api/webhooks/:id/test
GET  /api/webhooks/:id/deliveries   → recent delivery log
DELETE /api/webhooks/:id

Header per delivery:
  X-CLX-Event:       scan.created
  X-CLX-Event-Id:    <uuid>
  X-CLX-Signature:   t=<iso>,v1=<hmac-sha256-hex>

Signature payload:
  signature = HMAC-SHA256(event + "\\n" + event_id + "\\n" + timestamp + "\\n" + raw_body, signing_secret)`}</code></pre>
        </section>

        <section class="bg-card border border-gold/[0.08] rounded-xl p-5">
          <h2 class="text-sm font-semibold text-gold uppercase tracking-wider mb-3">
            <i class="fas fa-eye mr-2 text-xs"></i>Live preview
          </h2>
          <p class="text-sm text-white/70 mb-3">
            The scanner below is the actual production iframe. Open your dev console and listen for <code class="bg-surface px-1 rounded text-gold">postMessage</code>:
          </p>
          <div class="bg-black/40 rounded-xl p-2 border border-gold/10">
            <iframe
              src="/valuation?embed=1"
              width="100%"
              height="780"
              frameborder="0"
              style="border:0; border-radius:10px; background:#050505;"
              allow="camera; microphone; autoplay; encrypted-media"
            ></iframe>
          </div>
        </section>

        <footer class="mt-6 text-center text-xs text-white/20">
          Single-link schema · No API key required · Works from any domain · Drop in & go
        </footer>
      </article>
    </Layout>
  )
}
