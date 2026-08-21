import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/cloudflare-pages'
import valuationRoutes from './routes/api/valuation'
import inventoryRoutes from './routes/api/inventory'
import requestsRoutes from './routes/api/requests'
import matchingRoutes from './routes/api/matching'
import dossiersRoutes from './routes/api/dossiers'
import authRoutes from './routes/api/auth'
import historyRoutes from './routes/api/history'
import webhooksRoutes from './routes/api/webhooks'
import autocompleteRoutes from './routes/api/autocomplete'
import creditsRoutes from './routes/api/credits'
import { ragRoutes } from './routes/api/rag'
import { marketPriceRoutes } from './routes/api/marketPrices'
import { canonicalCertJson, verifyCertificate } from './lib/certSign'
import { HomePage } from './pages/home'
import { ValuationPage } from './pages/valuation'
import { InventoryPage } from './pages/inventory'
import { RequestsPage } from './pages/requests'
import { MatchingPage } from './pages/matching'
import { DossierPage } from './pages/dossier'
import { VerifyPage } from './pages/verify'
import { EmbedPage } from './pages/embed'
import { LoginPage } from './pages/login'
import { AccountPage } from './pages/account'
import { HistoryPage } from './pages/history'
import { ResetPasswordPage } from './pages/reset-password'

type Bindings = {
  DB?: D1Database
  GEMINI_API_KEY?: string
  FIREWORKS_API_KEY?: string
  AUTH_SECRET?: string
  APP_NAME?: string
  APP_VERSION?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Middleware
// audit M2: explicit origin allowlist instead of cors() wildcard. Embed hosts
// (watchfact.com etc.) send an Origin header; same-origin pages send none.
app.use('/api/*', cors({
  origin: (origin) => {
    if (!origin) return origin          // same-origin / curl — no CORS header needed
    try {
      const { hostname } = new URL(origin)
      const exact = new Set([
        'curatedlux.pages.dev',
        'watchfacts-poc.vercel.app',
        'localhost',
        '127.0.0.1',
      ])
      if (exact.has(hostname)) return origin
      if (hostname.endsWith('.vercel.app')) return origin
      return null
    } catch {
      return null
    }
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))
app.use('/api/*', logger())

// Static assets from public/static/
app.use('/static/*', serveStatic({ root: './public' }))

// --- API Routes ---
app.route('/api/valuation', valuationRoutes)
app.route('/api/inventory', inventoryRoutes)
app.route('/api/requests', requestsRoutes)
app.route('/api/matching', matchingRoutes)
app.route('/api/dossiers', dossiersRoutes)
app.route('/api/auth', authRoutes)
app.route('/api/history', historyRoutes)
app.route('/api/webhooks', webhooksRoutes)
app.route('/api/autocomplete', autocompleteRoutes)
app.route('/api/credits', creditsRoutes)
app.route('/api/rag', ragRoutes)
app.route('/api/market-prices', marketPriceRoutes)

// Health check
app.get('/api/health', (c) => c.json({
  status: 'ok',
  version: c.env.APP_VERSION || '2.5.0',
  app: c.env.APP_NAME || 'CuratedLux',
  features: ['vision', 'ocr', 'voice', 'embed', 'auth', 'history', 'webhooks', 'rag', 'market-prices'],
}))

// --- Frontend Pages ---
app.get('/', (c) => c.html(<HomePage />))
app.get('/valuation', (c) => {
  const embedFlag = c.req.query('embed') === '1'
  return c.html(<ValuationPage embed={embedFlag} />)
})
app.get('/inventory', (c) => c.html(<InventoryPage />))
app.get('/requests', (c) => c.html(<RequestsPage />))
app.get('/matching', (c) => c.html(<MatchingPage />))
app.get('/dossier/:id?', (c) => {
  const id = c.req.param('id')
  return c.html(<DossierPage itemId={id} />)
})
app.get('/verify/:id', async (c) => {
  const id = c.req.param('id')
  let dossier = null
  let valid = false
  let verificationHash = '0x00000000000000000000000000000000'
  let certStatus: string | undefined

  if (c.env.DB && id) {
    try {
      // A certificate is a DOSSIER. Resolve the id to one (falling back to the
      // inventory item it points at) and check its ES256 signature. Bare
      // inventory ids without a dossier do not verify — no certificate was
      // issued for them, so a "verified" page would be a false claim.
      let dos: any = await c.env.DB
        .prepare('SELECT inventory_id, certificate_data, cert_signature, cert_public_key, created_at FROM dossiers WHERE id = ?')
        .bind(id).first() as any
      if (!dos) {
        const inv = await c.env.DB.prepare('SELECT id FROM inventory WHERE id = ?').bind(id).first()
        if (inv) {
          dos = await c.env.DB
            .prepare('SELECT inventory_id, certificate_data, cert_signature, cert_public_key, created_at FROM dossiers WHERE inventory_id = ? LIMIT 1')
            .bind(inv.id).first() as any
        }
      }
      if (dos?.inventory_id) {
        const res = await c.env.DB.prepare('SELECT * FROM inventory WHERE id = ?').bind(dos.inventory_id).first()
        if (res) {
          dossier = res
          if (dos.cert_signature && dos.cert_public_key) {
            // Signed certificate: ES256 over the canonical payload rebuilt from
            // the CURRENT inventory row — tamper after signing ⇒ mismatch.
            const fields = {
              inventoryId: res.id,
              dossierId: dos.id,
              brand: res.brand || '',
              model: res.model || '',
              referenceNumber: res.reference_number || '',
              dial: res.dial || '',
              conditionLabel: res.condition_label || '',
              authenticityStatus: res.authenticity_status || '',
              confidence: Number(res.confidence) || 0,
              estimatedValue: Number(res.estimated_value) || 0,
              marketPrice: Number(res.market_price) || 0,
              priceSource: res.price_source || '',
              verifiedAt: (JSON.parse(dos.certificate_data || '{}') as any)?.verified_at || dos.created_at || '',
            }
            const payload = canonicalCertJson(fields)
            valid = await verifyCertificate(payload, dos.cert_signature, JSON.parse(dos.cert_public_key))
            certStatus = valid ? 'valid' : 'mismatch'
            verificationHash = valid ? payload.slice(0, 96) : 'SIGNATURE MISMATCH — record modified after issuance'
          } else {
            // Unsigned/legacy row: registry existence is the check, labeled as such.
            valid = true
            certStatus = 'legacy'
            verificationHash = 'Registry record exists — issued before ES256 certificate signing was enabled'
          }
        }
      }
    } catch { /* DB query error fallback */ }
  }
  if (!valid && id) {
    // audit C4: unknown ids must NOT verify. The previous demo fallback marked
    // ANY 2+ char id as a valid AUTHENTIC MATCH Rolex with a fabricated hash —
    // a counterfeit could be "proven" by linking /verify/anything.
    valid = false
    dossier = null
  }

  if (dossier && certStatus) (dossier as any).cert_status = certStatus
  return c.html(<VerifyPage id={id} valid={valid} dossier={dossier} verificationHash={verificationHash} />)
})

// New feature pages
app.get('/embed', (c) => c.html(<EmbedPage />))
app.get('/login', (c) => c.html(<LoginPage mode="login" />))
app.get('/signup', (c) => c.html(<LoginPage mode="signup" />))
app.get('/account', (c) => c.html(<AccountPage />))
app.get('/history', (c) => c.html(<HistoryPage />))
app.get('/reset-password', (c) => c.html(<ResetPasswordPage />))

// Explicit catch-alls (real routes, not notFound): the Pages adapter
// otherwise falls through to ASSETS and unknown paths crash as 500.
app.all('/api/*', (c) => c.json({ error: 'Not found', path: c.req.path }, 404))
app.all('*', (c) => {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>Not found — CuratedLux</title></head><body style="background:#0a0a0a;color:#e8e6e1;font-family:Georgia,serif;padding:4rem 1.5rem;text-align:center"><h1>Page not found</h1><p><a href="/" style="color:#e8e6e1">Back to CuratedLux</a></p></body></html>`
  return new Response(html, {
    status: 404,
    headers: { 'content-type': 'text/html; charset=UTF-8' },
  })
})

app.onError((err, c) => {
  console.error(err)
  if (c.req.path.startsWith('/api/')) {
    return c.json({ error: 'Internal error' }, 500)
  }
  return c.text('Internal Server Error', 500)
})

export default app
