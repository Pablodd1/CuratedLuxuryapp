import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/cloudflare-pages'
import valuationRoutes from './routes/api/valuation'
import inventoryRoutes from './routes/api/inventory'
import requestsRoutes from './routes/api/requests'
import matchingRoutes from './routes/api/matching'
import dossiersRoutes from './routes/api/dossiers'
import { HomePage } from './pages/home'
import { ValuationPage } from './pages/valuation'
import { InventoryPage } from './pages/inventory'
import { RequestsPage } from './pages/requests'
import { MatchingPage } from './pages/matching'
import { DossierPage } from './pages/dossier'

type Bindings = {
  DB: D1Database
  GEMINI_API_KEY?: string
  FIREWORKS_API_KEY?: string
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

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', version: c.env.APP_VERSION || '2.0.0' }))

// --- Frontend Pages ---
app.get('/', (c) => c.html(<HomePage />))
app.get('/valuation', (c) => c.html(<ValuationPage />))
app.get('/inventory', (c) => c.html(<InventoryPage />))
app.get('/requests', (c) => c.html(<RequestsPage />))
app.get('/matching', (c) => c.html(<MatchingPage />))
app.get('/dossier/:id?', (c) => {
  const id = c.req.param('id')
  return c.html(<DossierPage itemId={id} />)
})

export default app
