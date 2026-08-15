// CuratedLux — Credits + posted-items API
// GET  /api/credits/balance    → remaining credits
// POST /api/credits/post       → finalize an authentication (consume 1 credit + log posted item)
// GET  /api/credits/posted     → the user's capped posted history
import { Hono } from 'hono'
import { getUserCredits, consumeCredit, logPostedItem, DEFAULT_CREDITS, POSTED_HISTORY_CAP } from '../../lib/credits'

type Bindings = {
  DB: any
}

const app = new Hono<{ Bindings: Bindings; Variables: { user: any } }>()

// Require auth
app.use('*', async (c, next) => {
  const user = c.get('user')
  if (!user?.id) return c.json({ error: 'Authentication required' }, 401)
  await next()
})

// GET /api/credits/balance
app.get('/balance', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ credits: DEFAULT_CREDITS, creditsUsed: 0, limit: POSTED_HISTORY_CAP, db: false })
  const user = c.get('user')
  const state = await getUserCredits(db, user.id)
  return c.json({ ...state, limit: POSTED_HISTORY_CAP, db: true })
})

// POST /api/credits/post — finalize a photo-authentication into the posted log.
// Consumes one credit. Body carries the (optionally user-corrected) item fields.
app.post('/post', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Database unavailable' }, 503)
  const user = c.get('user')

  const body = await c.req.json().catch(() => ({}))

  // 1. Consume a credit (throws NO_CREDITS if exhausted)
  let state
  try {
    state = await consumeCredit(db, user.id)
  } catch (e: any) {
    if (e.message === 'NO_CREDITS') {
      return c.json({ error: 'NO_CREDITS', message: 'Out of authentication credits' }, 402)
    }
    throw e
  }

  // 2. Log the posted item (auto-pruned to cap)
  await logPostedItem(db, user.id, {
    inventory_id: body.inventory_id || null,
    category: body.category,
    brand: body.brand,
    model: body.model,
    referenceNumber: body.referenceNumber ?? body.reference_number,
    year: body.year,
    condition_label: body.condition_label,
    estimatedValue: body.estimatedValue ?? body.estimated_value,
    currency: body.currency,
    confidence: body.confidence,
    authenticityStatus: body.authenticityStatus ?? body.authenticity_status,
    source: body.source || 'ai',
  })

  return c.json({ success: true, ...state, limit: POSTED_HISTORY_CAP })
})

// GET /api/credits/posted — capped history of finalized posts
app.get('/posted', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ items: [], db: false })
  const user = c.get('user')
  const items = await db.prepare(
    'SELECT * FROM posted_items WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
  ).bind(user.id, POSTED_HISTORY_CAP).all()
  return c.json({ items: items?.results || [], limit: POSTED_HISTORY_CAP, db: true })
})

export default app
