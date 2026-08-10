// src/routes/api/history.ts — scan history CRUD for authenticated users
import { Hono } from 'hono'
import { requireAuth, optionalAuth, type User } from '../../lib/auth'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings; Variables: { user: User | null } }>()

// Optional auth middleware — saves are still allowed without login (anonymous)
app.use('*', optionalAuth)

// POST /api/history — save scan (optionally attached to user if signed in)
app.post('/', async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json<{
      category?: string
      brand?: string
      model?: string
      reference_number?: string
      year?: number | null
      condition_grade?: number
      condition_label?: string
      estimated_value?: number
      currency?: string
      confidence?: number
      authenticity_status?: string
      reasoning?: string
      inclusions?: string[] | string
      red_flags?: string[] | string
      image_count?: number
      source?: 'camera' | 'voice' | 'manual' | 'embed'
      scan_payload?: any
    }>()

    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const inclusions = typeof body.inclusions === 'string' ? body.inclusions : JSON.stringify(body.inclusions || [])
    const red_flags = typeof body.red_flags === 'string' ? body.red_flags : JSON.stringify(body.red_flags || [])

    await c.env.DB.prepare(
      `INSERT INTO scan_history
        (id, user_id, source, category, brand, model, reference_number, year,
         condition_grade, condition_label, estimated_value, currency, confidence,
         authenticity_status, reasoning, inclusions, red_flags, image_count,
         scan_payload, scan_source_host, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        user?.id || null,
        body.source || 'manual',
        body.category || 'Watches',
        body.brand || '',
        body.model || '',
        body.reference_number || '',
        body.year || null,
        body.condition_grade ?? 3,
        body.condition_label || 'Good',
        body.estimated_value || 0,
        body.currency || 'USD',
        body.confidence || 0,
        body.authenticity_status || 'PENDING',
        body.reasoning || '',
        inclusions,
        red_flags,
        body.image_count || 0,
        JSON.stringify(body.scan_payload || {}),
        c.req.header('referer') || null,
        now
      )
      .run()

    const row = await c.env.DB.prepare('SELECT * FROM scan_history WHERE id = ?').bind(id).first()
    return c.json({ scan: row, attached_to_user: !!user }, 201)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// GET /api/history — list scans for current user (or all if admin)
app.get('/', async (c) => {
  const user = c.get('user')
  if (!user) return c.json({ error: 'unauthorized', message: 'Sign in to view history' }, 401)
  const limit = Math.min(Number(c.req.query('limit')) || 50, 200)
  const offset = Number(c.req.query('offset')) || 0
  const { results } = await c.env.DB
    .prepare('SELECT * FROM scan_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .bind(user.id, limit, offset)
    .all()
  const count = await c.env.DB
    .prepare('SELECT COUNT(*) as total FROM scan_history WHERE user_id = ?')
    .bind(user.id)
    .first<{ total: number }>()
  return c.json({ scans: results, total: count?.total || 0, limit, offset })
})

// GET /api/history/stats — user aggregate stats
app.get('/stats', async (c) => {
  const user = c.get('user')
  if (!user) return c.json({ error: 'unauthorized' }, 401)
  const total = await c.env.DB
    .prepare('SELECT COUNT(*) as c FROM scan_history WHERE user_id = ?')
    .bind(user.id)
    .first<{ c: number }>()
  const totalValue = await c.env.DB
    .prepare('SELECT SUM(estimated_value) as v FROM scan_history WHERE user_id = ?')
    .bind(user.id)
    .first<{ v: number }>()
  const byCategory = await c.env.DB
    .prepare('SELECT category, COUNT(*) as c FROM scan_history WHERE user_id = ? GROUP BY category')
    .bind(user.id)
    .all()
  return c.json({
    totalScans: total?.c || 0,
    portfolioValue: totalValue?.v || 0,
    byCategory: byCategory.results,
  })
})

// GET /api/history/:id — single scan (owner only)
app.get('/:id', async (c) => {
  const user = c.get('user')
  if (!user) return c.json({ error: 'unauthorized' }, 401)
  const id = c.req.param('id')
  const row = await c.env.DB
    .prepare('SELECT * FROM scan_history WHERE id = ? AND user_id = ?')
    .bind(id, user.id)
    .first()
  if (!row) return c.json({ error: 'not_found' }, 404)
  return c.json({ scan: row })
})

// DELETE /api/history/:id — owner only
app.delete('/:id', async (c) => {
  const user = c.get('user')
  if (!user) return c.json({ error: 'unauthorized' }, 401)
  const id = c.req.param('id')
  await c.env.DB
    .prepare('DELETE FROM scan_history WHERE id = ? AND user_id = ?')
    .bind(id, user.id)
    .run()
  return c.json({ success: true, id })
})

export default app
