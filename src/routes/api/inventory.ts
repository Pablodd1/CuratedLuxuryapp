import { Hono } from 'hono'
import { requireAuth, optionalAuth } from '../../lib/auth'

const app = new Hono<{ Bindings: { DB: any } }>()

// Auth context for every request (audit C3). Reads stay public (gallery-style
// listing was public before and is read-only); ALL mutations require auth and
// enforce ownership. Admins (role admin/curator) may manage any item.
app.use('*', optionalAuth)

function canManage(user: any, item: any): boolean {
  if (!user) return false
  if (user.role === 'admin' || user.role === 'curator') return true
  return item?.owner_id === user.id
}

// GET /api/inventory — list all inventory items (public read, unchanged shape)
app.get('/', async (c) => {
  try {
    const db = c.env.DB
    const { status, category, brand, limit, offset } = c.req.query()
    let sql = 'SELECT * FROM inventory WHERE 1=1'
    const params: any[] = []

    if (status) { sql += ' AND status = ?'; params.push(status) }
    if (category) { sql += ' AND category = ?'; params.push(category) }
    if (brand) { sql += ' AND brand LIKE ?'; params.push(`%${brand}%`) }

    sql += ' ORDER BY created_at DESC'
    sql += ` LIMIT ${Math.min(Number(limit) || 50, 100)} OFFSET ${Number(offset) || 0}`

    const { results } = await db.prepare(sql).bind(...params).all()
    const count = await db.prepare('SELECT COUNT(*) as total FROM inventory').first()

    return c.json({ items: results, total: count?.total || 0, limit: Number(limit) || 50, offset: Number(offset) || 0 })
  } catch {
    return c.json({ error: 'Failed to list inventory' }, 500)
  }
})

// GET /api/inventory/:id — get single item (public read)
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const item = await c.env.DB.prepare('SELECT * FROM inventory WHERE id = ?').bind(id).first()
    if (!item) return c.json({ error: 'Not found' }, 404)
    return c.json(item)
  } catch {
    return c.json({ error: 'Failed to fetch item' }, 500)
  }
})

// POST /api/inventory — create inventory item (AUTH REQUIRED; owner from session)
app.post('/', requireAuth, async (c) => {
  try {
    const user: any = c.get('user')
    const body = await c.req.json()
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    // audit C3: owner_id is derived from the authenticated session — the request
    // body can no longer assert someone else's identity.
    // NOTE: prod inventory table has no updated_at / escrow_amount columns (schema 0001).
    await c.env.DB.prepare(`INSERT INTO inventory (id, owner_id, category, brand, model, reference_number, dial, year, condition_grade, condition_label, estimated_value, market_price, price_source, price_as_of, currency, confidence, authenticity_status, reasoning, inclusions, image_count, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, user.id, body.category || 'Watches', body.brand || '', body.model || '', body.reference_number || '',
        body.dial || '', body.year || null, body.condition_grade || 3, body.condition_label || 'Good',
        body.estimated_value || 0, body.market_price || 0, body.price_source || '', body.price_as_of || '',
        body.currency || 'USD', body.confidence || 0,
        body.authenticity_status || 'PENDING', body.reasoning || '',
        typeof body.inclusions === 'string' ? body.inclusions : JSON.stringify(body.inclusions || []),
        body.image_count || 0, body.status || 'active', now)
      .run()

    const item = await c.env.DB.prepare('SELECT * FROM inventory WHERE id = ?').bind(id).first()
    return c.json(item, 201)
  } catch {
    return c.json({ error: 'Failed to create item' }, 500)
  }
})

// PUT /api/inventory/:id — update item (AUTH + OWNERSHIP)
app.put('/:id', requireAuth, async (c) => {
  try {
    const user: any = c.get('user')
    const id = c.req.param('id')
    const body = await c.req.json()
    const now = new Date().toISOString()

    const existing: any = await c.env.DB.prepare('SELECT * FROM inventory WHERE id = ?').bind(id).first()
    if (!existing) return c.json({ error: 'Not found' }, 404)
    if (!canManage(user, existing)) return c.json({ error: 'forbidden', message: 'Not your item' }, 403)

    // NOTE: no updated_at/escrow_amount columns in prod schema — write allowed fields only
    await c.env.DB.prepare(`UPDATE inventory SET category=?, brand=?, model=?, reference_number=?, dial=?, year=?, condition_grade=?, condition_label=?, estimated_value=?, market_price=?, price_source=?, price_as_of=?, currency=?, confidence=?, authenticity_status=?, reasoning=?, inclusions=?, image_count=?, status=? WHERE id=?`)
      .bind(body.category ?? existing.category, body.brand ?? existing.brand, body.model ?? existing.model,
        body.reference_number ?? existing.reference_number, body.dial ?? existing.dial ?? '', body.year ?? existing.year,
        body.condition_grade ?? existing.condition_grade, body.condition_label ?? existing.condition_label,
        body.estimated_value ?? existing.estimated_value, body.market_price ?? existing.market_price ?? 0,
        body.price_source ?? existing.price_source ?? '', body.price_as_of ?? existing.price_as_of ?? '',
        body.currency ?? existing.currency,
        body.confidence ?? existing.confidence, body.authenticity_status ?? existing.authenticity_status,
        body.reasoning ?? existing.reasoning, typeof body.inclusions === 'string' ? body.inclusions : JSON.stringify(body.inclusions ?? []),
        body.image_count ?? existing.image_count, body.status ?? existing.status,
        id)
      .run()

    const updated = await c.env.DB.prepare('SELECT * FROM inventory WHERE id = ?').bind(id).first()
    return c.json(updated)
  } catch {
    return c.json({ error: 'Failed to update item' }, 500)
  }
})

// DELETE /api/inventory/:id — soft-delete (AUTH + OWNERSHIP)
app.delete('/:id', requireAuth, async (c) => {
  try {
    const user: any = c.get('user')
    const id = c.req.param('id')
    const now = new Date().toISOString()

    const existing: any = await c.env.DB.prepare('SELECT * FROM inventory WHERE id = ?').bind(id).first()
    if (!existing) return c.json({ error: 'Not found' }, 404)
    if (!canManage(user, existing)) return c.json({ error: 'forbidden', message: 'Not your item' }, 403)

    await c.env.DB.prepare('UPDATE inventory SET status=? WHERE id=?').bind('archived', id).run()
    return c.json({ success: true, id })
  } catch {
    return c.json({ error: 'Failed to archive item' }, 500)
  }
})

// GET /api/inventory/stats/summary — dashboard stats (public read)
app.get('/stats/summary', async (c) => {
  try {
    const db = c.env.DB
    const total = await db.prepare('SELECT COUNT(*) as c FROM inventory WHERE status = ?').bind('active').first()
    const byCategory = await db.prepare('SELECT category, COUNT(*) as c FROM inventory WHERE status = ? GROUP BY category').bind('active').all()
    const totalValue = await db.prepare('SELECT SUM(estimated_value) as v FROM inventory WHERE status = ?').bind('active').first()
    const recent = await db.prepare('SELECT * FROM inventory WHERE status = ? ORDER BY created_at DESC LIMIT 5').bind('active').all()

    return c.json({
      totalItems: (total as any)?.c || 0,
      totalValue: (totalValue as any)?.v || 0,
      byCategory: byCategory.results,
      recent: recent.results
    })
  } catch {
    return c.json({ error: 'Failed to compute stats' }, 500)
  }
})

export default app
