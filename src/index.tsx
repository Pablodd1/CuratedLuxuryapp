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
import { HomePage } from './pages/home'
import { ValuationPage } from './pages/valuation'
import { InventoryPage } from './pages/inventory'
import { RequestsPage } from './pages/requests'
import { MatchingPage } from './pages/matching'
import { DossierPage } from './pages/dossier'
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
app.use('/api/*', cors())
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

// Health check
app.get('/api/health', (c) => c.json({
  status: 'ok',
  version: c.env.APP_VERSION || '2.5.0',
  app: c.env.APP_NAME || 'CuratedLux',
  features: ['vision', 'ocr', 'voice', 'embed', 'auth', 'history', 'webhooks'],
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

// New feature pages
app.get('/embed', (c) => c.html(<EmbedPage />))
app.get('/login', (c) => c.html(<LoginPage mode="login" />))
app.get('/signup', (c) => c.html(<LoginPage mode="signup" />))
app.get('/account', (c) => c.html(<AccountPage />))
app.get('/history', (c) => c.html(<HistoryPage />))
app.get('/reset-password', (c) => c.html(<ResetPasswordPage />))

export default app
