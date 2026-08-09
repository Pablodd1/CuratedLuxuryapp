import { Hono } from 'hono'

const app = new Hono()

// GET /api/dossiers — list all dossiers with inventory join
app.get('/', async (c) => {
  try {
    const db = c.env.DB
    const { owner_id, limit, offset } = c.req.query()
    let sql = `SELECT d.*, i.brand, i.model, i.reference_number, i.estimated_value, i.authenticity_status, i.category
      FROM dossiers d JOIN inventory i ON d.inventory_id = i.id WHERE 1=1`
    const params: any[] = []

    if (owner_id) { sql += ' AND d.owner_id = ?'; params.push(owner_id) }

    sql += ' ORDER BY d.created_at DESC'
    sql += ` LIMIT ${Math.min(Number(limit) || 50, 100)} OFFSET ${Number(offset) || 0}`

    const { results } = await db.prepare(sql).bind(...params).all()
    return c.json({ items: results, limit: Number(limit) || 50, offset: Number(offset) || 0 })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// GET /api/dossiers/:id — single dossier with full inventory join
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const dossier = await c.env.DB.prepare(`SELECT d.*, 
      i.brand, i.model, i.reference_number, i.year, i.condition_label, i.estimated_value, i.currency,
      i.authenticity_status, i.reasoning, i.confidence, i.confidence_logo, i.confidence_serial,
      i.confidence_materials, i.confidence_bezel, i.inclusions, i.image_count, i.category
      FROM dossiers d JOIN inventory i ON d.inventory_id = i.id WHERE d.id = ?`).bind(id).first()

    if (!dossier) return c.json({ error: 'Not found' }, 404)

    // Increment export count on read
    await c.env.DB.prepare('UPDATE dossiers SET export_count = export_count + 1 WHERE id = ?').bind(id).run()

    return c.json(dossier)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// POST /api/dossiers — create a new dossier for an inventory item
app.post('/', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.json<{
      inventory_id: string; owner_id?: string; appraiser_name?: string;
      appraiser_signature?: string; notes?: string
    }>()
    const now = new Date().toISOString()

    if (!body.inventory_id) return c.json({ error: 'inventory_id is required' }, 400)

    // Verify inventory item exists
    const inv = await db.prepare('SELECT id FROM inventory WHERE id = ?').bind(body.inventory_id).first()
    if (!inv) return c.json({ error: 'Inventory item not found' }, 404)

    const id = crypto.randomUUID()
    const qrCode = `CL-DOSSIER-${id.slice(0, 8).toUpperCase()}`

    await db.prepare(`INSERT INTO dossiers (id, inventory_id, owner_id, appraiser_name, appraiser_signature, qr_verification_code, device_hash, notes, export_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`)
      .bind(id, body.inventory_id, body.owner_id || 'demo-user',
        body.appraiser_name || 'CuratedLux AI Appraiser',
        body.appraiser_signature || 'Digitally Certified by CuratedLux AI',
        qrCode, '', body.notes || '', now, now)
      .run()

    const dossier = await db.prepare(`SELECT d.*, i.brand, i.model, i.reference_number, i.estimated_value
      FROM dossiers d JOIN inventory i ON d.inventory_id = i.id WHERE d.id = ?`).bind(id).first()

    // Log activity
    await db.prepare('INSERT INTO activity_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .bind(body.owner_id || 'demo-user', 'CREATE_DOSSIER', 'dossier', id, `Dossier created for inventory ${body.inventory_id}`)
      .run()

    return c.json(dossier, 201)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// PUT /api/dossiers/:id — update dossier fields
app.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const now = new Date().toISOString()

    const existing = await c.env.DB.prepare('SELECT * FROM dossiers WHERE id = ?').bind(id).first()
    if (!existing) return c.json({ error: 'Not found' }, 404)

    await c.env.DB.prepare(`UPDATE dossiers SET appraiser_name=?, appraiser_signature=?, notes=?, updated_at=? WHERE id=?`)
      .bind(body.appraiser_name ?? existing.appraiser_name,
        body.appraiser_signature ?? existing.appraiser_signature,
        body.notes ?? existing.notes, now, id)
      .run()

    const updated = await c.env.DB.prepare(`SELECT d.*, i.brand, i.model, i.reference_number, i.estimated_value
      FROM dossiers d JOIN inventory i ON d.inventory_id = i.id WHERE d.id = ?`).bind(id).first()
    return c.json(updated)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// POST /api/dossiers/:id/export — increment export counter
app.post('/:id/export', async (c) => {
  try {
    const id = c.req.param('id')
    const dossier = await c.env.DB.prepare('SELECT * FROM dossiers WHERE id = ?').bind(id).first()
    if (!dossier) return c.json({ error: 'Not found' }, 404)

    const result = await c.env.DB.prepare(
      'UPDATE dossiers SET export_count = export_count + 1, updated_at = ? WHERE id = ?'
    ).bind(new Date().toISOString(), id).run()

    const updated = await c.env.DB.prepare('SELECT * FROM dossiers WHERE id = ?').bind(id).first()

    // Log activity
    await c.env.DB.prepare('INSERT INTO activity_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .bind('demo-user', 'EXPORT_DOSSIER', 'dossier', id, `Dossier exported (count: ${updated.export_count})`)
      .run()

    return c.json({ success: true, export_count: updated.export_count })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

export default app
