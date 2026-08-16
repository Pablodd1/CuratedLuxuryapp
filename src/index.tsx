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
    const allowed = [
      'https://curatedlux.pages.dev',
      'https://watchfacts-poc.vercel.app',
      'https://*.vercel.app',
    ]
    if (!origin) return null            // same-origin / curl — nothing to allow
    return allowed.includes(origin) ? origin : null
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

  if (c.env.DB && id) {
    try {
      // 1. Direct inventory id
      let res = await c.env.DB.prepare('SELECT * FROM inventory WHERE id = ?').bind(id).first()
      if (!res) {
        // 2. Dossier id → resolve the underlying inventory item so a shared
        //    /verify/{dossierId} link talks to the same verified asset.
        const dos = await c.env.DB
          .prepare('SELECT inventory_id, certificate_data FROM dossiers WHERE id = ?')
          .bind(id).first() as any
        if (dos?.inventory_id) {
          res = await c.env.DB.prepare('SELECT * FROM inventory WHERE id = ?').bind(dos.inventory_id).first()
        }
      }
      if (res) {
        dossier = res
        valid = true
        verificationHash = '0x' + Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(res)))))
          .map(b => b.toString(16).padStart(2, '0')).join('')
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

  return c.html(<VerifyPage id={id} valid={valid} dossier={dossier} verificationHash={verificationHash} />)
})

// New feature pages
app.get('/embed', (c) => c.html(<EmbedPage />))
app.get('/login', (c) => c.html(<LoginPage mode="login" />))
app.get('/signup', (c) => c.html(<LoginPage mode="signup" />))
app.get('/account', (c) => c.html(<AccountPage />))
app.get('/history', (c) => c.html(<HistoryPage />))
app.get('/reset-password', (c) => c.html(<ResetPasswordPage />))

export default app
