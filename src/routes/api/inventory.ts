import { Hono } from 'hono'

const app = new Hono()

// GET /api/inventory — list all inventory items
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
    const count = await db.prepare('SELECT COUNT(*) as total FROM inventory').first<{ total: number }>()

    return c.json({ items: results, total: count?.total || 0, limit: Number(limit) || 50, offset: Number(offset) || 0 })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// GET /api/inventory/:id — get single item
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const item = await c.env.DB.prepare('SELECT * FROM inventory WHERE id = ?').bind(id).first()
    if (!item) return c.json({ error: 'Not found' }, 404)
    return c.json(item)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// POST /api/inventory — create inventory item
app.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    await c.env.DB.prepare(`INSERT INTO inventory (id, owner_id, category, brand, model, reference_number, year, condition_grade, condition_label, estimated_value, currency, confidence, authenticity_status, reasoning, inclusions, image_count, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, body.owner_id || 'demo-user', body.category, body.brand, body.model, body.reference_number || '',
        body.year || null, body.condition_grade || 3, body.condition_label || 'Good',
        body.estimated_value || 0, body.currency || 'USD', body.confidence || 0,
        body.authenticity_status || 'PENDING', body.reasoning || '',
        typeof body.inclusions === 'string' ? body.inclusions : JSON.stringify(body.inclusions || []),
        body.image_count || 0, body.status || 'active', now, now)
      .run()

    const item = await c.env.DB.prepare('SELECT * FROM inventory WHERE id = ?').bind(id).first()
    return c.json(item, 201)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// PUT /api/inventory/:id — update item
app.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const now = new Date().toISOString()

    const existing = await c.env.DB.prepare('SELECT * FROM inventory WHERE id = ?').bind(id).first()
    if (!existing) return c.json({ error: 'Not found' }, 404)

    await c.env.DB.prepare(`UPDATE inventory SET category=?, brand=?, model=?, reference_number=?, year=?, condition_grade=?, condition_label=?, estimated_value=?, currency=?, confidence=?, authenticity_status=?, reasoning=?, inclusions=?, image_count=?, status=?, escrow_amount=?, updated_at=? WHERE id=?`)
      .bind(body.category ?? existing.category, body.brand ?? existing.brand, body.model ?? existing.model,
        body.reference_number ?? existing.reference_number, body.year ?? existing.year,
        body.condition_grade ?? existing.condition_grade, body.condition_label ?? existing.condition_label,
        body.estimated_value ?? existing.estimated_value, body.currency ?? existing.currency,
        body.confidence ?? existing.confidence, body.authenticity_status ?? existing.authenticity_status,
        body.reasoning ?? existing.reasoning, typeof body.inclusions === 'string' ? body.inclusions : JSON.stringify(body.inclusions ?? []),
        body.image_count ?? existing.image_count, body.status ?? existing.status, body.escrow_amount ?? existing.escrow_amount,
        now, id)
      .run()

    const updated = await c.env.DB.prepare('SELECT * FROM inventory WHERE id = ?').bind(id).first()
    return c.json(updated)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// DELETE /api/inventory/:id — soft-delete (archive)
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const now = new Date().toISOString()
    await c.env.DB.prepare('UPDATE inventory SET status=?, updated_at=? WHERE id=?').bind('archived', now, id).run()
    return c.json({ success: true, id })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// GET /api/inventory/stats/summary — dashboard stats
app.get('/stats/summary', async (c) => {
  try {
    const db = c.env.DB
    const total = await db.prepare('SELECT COUNT(*) as c FROM inventory WHERE status = ?').bind('active').first<{ c: number }>()
    const byCategory = await db.prepare('SELECT category, COUNT(*) as c FROM inventory WHERE status = ? GROUP BY category').bind('active').all()
    const totalValue = await db.prepare('SELECT SUM(estimated_value) as v FROM inventory WHERE status = ?').bind('active').first<{ v: number }>()
    const recent = await db.prepare('SELECT * FROM inventory WHERE status = ? ORDER BY created_at DESC LIMIT 5').bind('active').all()

    return c.json({
      totalItems: total?.c || 0,
      totalValue: totalValue?.v || 0,
      byCategory: byCategory.results,
      recent: recent.results
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

export default app
