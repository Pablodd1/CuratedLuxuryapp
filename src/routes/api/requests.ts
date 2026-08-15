import { Hono } from 'hono'
import { requireAuth, optionalAuth } from '../../lib/auth'

const app = new Hono<{ Bindings: { DB: any } }>()

// audit C3: attach auth context; mutations gated below
app.use('*', optionalAuth)

// GET /api/requests — list client requests with filters
app.get('/', async (c) => {
  try {
    const db = c.env.DB
    const { status, brand, urgency, limit, offset } = c.req.query()
    let sql = 'SELECT * FROM client_requests WHERE 1=1'
    const params: any[] = []

    if (status) { sql += ' AND status = ?'; params.push(status) }
    if (brand) { sql += ' AND looking_for_brand LIKE ?'; params.push(`%${brand}%`) }
    if (urgency) { sql += ' AND urgency = ?'; params.push(urgency) }

    sql += ' ORDER BY created_at DESC'
    sql += ` LIMIT ${Math.min(Number(limit) || 50, 100)} OFFSET ${Number(offset) || 0}`

    const { results } = await db.prepare(sql).bind(...params).all()
    const count = await db.prepare('SELECT COUNT(*) as total FROM client_requests').first()

    return c.json({ items: results, total: count?.total || 0, limit: Number(limit) || 50, offset: Number(offset) || 0 })
  } catch (err: any) {
    return c.json({ error: 'Server error' }, 500)
  }
})

// GET /api/requests/:id — single request
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const item = await c.env.DB.prepare('SELECT * FROM client_requests WHERE id = ?').bind(id).first()
    if (!item) return c.json({ error: 'Not found' }, 404)
    return c.json(item)
  } catch (err: any) {
    return c.json({ error: 'Server error' }, 500)
  }
})

// POST /api/requests — create new client request
app.post('/', requireAuth, async (c) => {
  try {
    const user: any = c.get('user')
    const body = await c.req.json()
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    await c.env.DB.prepare(`INSERT INTO client_requests (id, owner_id, client_name, looking_for_brand, looking_for_model, reference_number, budget_usd, currency, urgency, condition_required, notes, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id,
        user.id, // audit C3: owner from session, not client-asserted
        body.client_name || 'Anonymous Client',
        body.looking_for_brand,
        body.looking_for_model,
        body.reference_number || '',
        body.budget_usd || 0,
        body.currency || 'USD',
        body.urgency || 'Flexible',
        body.condition_required ?? 3,
        body.notes || '',
        body.status || 'active',
        now)
      .run()

    const item = await c.env.DB.prepare('SELECT * FROM client_requests WHERE id = ?').bind(id).first()
    return c.json(item, 201)
  } catch (err: any) {
    return c.json({ error: 'Server error' }, 500)
  }
})

// PUT /api/requests/:id — update request
app.put('/:id', requireAuth, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const now = new Date().toISOString()

    const existing = await c.env.DB.prepare('SELECT * FROM client_requests WHERE id = ?').bind(id).first()
    if (!existing) return c.json({ error: 'Not found' }, 404)

    await c.env.DB.prepare(`UPDATE client_requests SET client_name=?, looking_for_brand=?, looking_for_model=?, reference_number=?, budget_usd=?, currency=?, urgency=?, condition_required=?, notes=?, status=? WHERE id=?`)
      .bind(body.client_name ?? existing.client_name,
        body.looking_for_brand ?? existing.looking_for_brand,
        body.looking_for_model ?? existing.looking_for_model,
        body.reference_number ?? existing.reference_number,
        body.budget_usd ?? existing.budget_usd,
        body.currency ?? existing.currency,
        body.urgency ?? existing.urgency,
        body.condition_required ?? existing.condition_required,
        body.notes ?? existing.notes,
        body.status ?? existing.status,
        id)
      .run()

    const updated = await c.env.DB.prepare('SELECT * FROM client_requests WHERE id = ?').bind(id).first()
    return c.json(updated)
  } catch (err: any) {
    return c.json({ error: 'Server error' }, 500)
  }
})

// DELETE /api/requests/:id — cancel request (soft)
app.delete('/:id', requireAuth, async (c) => {
  try {
    const id = c.req.param('id')
    const now = new Date().toISOString()
    await c.env.DB.prepare('UPDATE client_requests SET status=? WHERE id=?').bind('cancelled', id).run()
    return c.json({ success: true, id })
  } catch (err: any) {
    return c.json({ error: 'Server error' }, 500)
  }
})

// GET /api/requests/stats/summary — dashboard aggregation for requests
app.get('/stats/summary', async (c) => {
  try {
    const db = c.env.DB
    const total = await db.prepare('SELECT COUNT(*) as c FROM client_requests WHERE status != ?').bind('cancelled').first()
    const byUrgency = await db.prepare('SELECT urgency, COUNT(*) as c FROM client_requests WHERE status != ? GROUP BY urgency').bind('cancelled').all()
    const totalBudget = await db.prepare('SELECT SUM(budget_usd) as v FROM client_requests WHERE status = ?').bind('active').first()
    const recent = await db.prepare('SELECT * FROM client_requests WHERE status != ? ORDER BY created_at DESC LIMIT 5').bind('cancelled').all()

    return c.json({
      totalRequests: total?.c || 0,
      totalBudget: totalBudget?.v || 0,
      byUrgency: byUrgency.results,
      recent: recent.results
    })
  } catch (err: any) {
    return c.json({ error: 'Server error' }, 500)
  }
})

export default app
