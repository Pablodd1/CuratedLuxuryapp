import { Hono } from 'hono'
import { requireAuth, optionalAuth } from '../../lib/auth'

const app = new Hono<{ Bindings: { DB: any } }>()

// audit C3: attach auth context; mutations gated below
app.use('*', optionalAuth)

// --- Matchmaking Engine ---
// POST /api/matching/run — run matchmaking for a specific request or all active requests
app.post('/run', requireAuth, async (c) => {
  try {
    const db = c.env.DB
    const { request_id } = await c.req.json<{ request_id?: string }>()
    const now = new Date().toISOString()

    // Fetch active requests
    let requestsQuery = 'SELECT * FROM client_requests WHERE status = ?'
    const params: any[] = ['active']
    if (request_id) {
      requestsQuery += ' AND id = ?'
      params.push(request_id)
    }
    const { results: requests } = await db.prepare(requestsQuery).bind(...params).all<{
      id: string; looking_for_brand: string; looking_for_model: string;
      budget_usd: number; condition_required: number
    }>()

    if (!requests.length) {
      return c.json({ matches_created: 0, message: 'No active requests to match' })
    }

    // Fetch active inventory
    const { results: inventory } = await db.prepare(
      'SELECT * FROM inventory WHERE status = ?'
    ).bind('active').all<{
      id: string; brand: string; model: string; estimated_value: number;
      condition_grade: number
    }>()

    if (!inventory.length) {
      return c.json({ matches_created: 0, message: 'No active inventory items to match against' })
    }

    let matchesCreated = 0

    for (const req of requests) {
      for (const inv of inventory) {
        // --- Scoring Algorithm ---
        // Brand score: exact match = 100, partial substring = 60
        const reqBrand = req.looking_for_brand.toLowerCase()
        const invBrand = inv.brand.toLowerCase()
        let brandScore = 0
        if (reqBrand === invBrand) brandScore = 100
        else if (invBrand.includes(reqBrand) || reqBrand.includes(invBrand)) brandScore = 60

        // Model score: exact match = 100, partial substring = 50
        const reqModel = req.looking_for_model.toLowerCase()
        const invModel = inv.model.toLowerCase()
        let modelScore = 0
        if (reqModel === invModel) modelScore = 100
        else if (invModel.includes(reqModel) || reqModel.includes(invModel)) modelScore = 50

        // Price score: how close the inventory price is to budget
        let priceScore = 0
        if (req.budget_usd > 0 && inv.estimated_value > 0) {
          const ratio = inv.estimated_value / req.budget_usd
          if (ratio <= 1.0) priceScore = 100 // Under or at budget
          else if (ratio <= 1.15) priceScore = 85 // Within 15% over
          else if (ratio <= 1.30) priceScore = 60 // Within 30% over
          else if (ratio <= 1.50) priceScore = 35 // Within 50% over
          else priceScore = 10 // Way over budget
        }

        // Condition score: how close the item condition is to requirement
        let conditionScore = 0
        const diff = inv.condition_grade - req.condition_required
        if (diff >= 0) conditionScore = 100 // Meets or exceeds
        else if (diff === -1) conditionScore = 70 // One grade below
        else if (diff === -2) conditionScore = 35 // Two grades below
        else conditionScore = 10 // Three+ grades below

        // Weighted overall score: Brand 30%, Model 25%, Price 25%, Condition 20%
        const overallScore = Math.round(
          brandScore * 0.30 + modelScore * 0.25 + priceScore * 0.25 + conditionScore * 0.20
        )

        // Only create matches that cross a minimum threshold
        if (overallScore >= 20) {
          // Check for duplicate match
          const existing = await db.prepare(
            'SELECT id FROM matches WHERE inventory_id = ? AND request_id = ?'
          ).bind(inv.id, req.id).first()

          if (!existing) {
            const matchId = crypto.randomUUID()
            await db.prepare(`INSERT INTO matches (id, inventory_id, request_id, brand_score, model_score, price_score, condition_score, overall_score, match_status, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`)
              .bind(matchId, inv.id, req.id, brandScore, modelScore, priceScore, conditionScore, overallScore, now)
              .run()
            matchesCreated++
          }
        }
      }
    }

    return c.json({ matches_created: matchesCreated, requests_processed: requests.length, inventory_scanned: inventory.length })
  } catch (err: any) {
    return c.json({ error: 'Server error' }, 500)
  }
})

// GET /api/matching — list matches with filters
app.get('/', async (c) => {
  try {
    const db = c.env.DB
    const { request_id, inventory_id, status, limit, offset } = c.req.query()
    let sql = `SELECT m.*, 
      i.brand as inv_brand, i.model as inv_model, i.estimated_value, i.condition_label,
      r.client_name, r.looking_for_brand, r.looking_for_model, r.budget_usd
      FROM matches m
      JOIN inventory i ON m.inventory_id = i.id
      JOIN client_requests r ON m.request_id = r.id
      WHERE 1=1`
    const params: any[] = []

    if (request_id) { sql += ' AND m.request_id = ?'; params.push(request_id) }
    if (inventory_id) { sql += ' AND m.inventory_id = ?'; params.push(inventory_id) }
    if (status) { sql += ' AND m.match_status = ?'; params.push(status) }

    sql += ' ORDER BY m.overall_score DESC'
    sql += ` LIMIT ${Math.min(Number(limit) || 50, 100)} OFFSET ${Number(offset) || 0}`

    const { results } = await db.prepare(sql).bind(...params).all()
    return c.json({ items: results, limit: Number(limit) || 50, offset: Number(offset) || 0 })
  } catch (err: any) {
    return c.json({ error: 'Server error' }, 500)
  }
})

// GET /api/matching/:id — single match with joined details
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const match = await c.env.DB.prepare(`SELECT m.*, 
      i.brand as inv_brand, i.model as inv_model, i.reference_number as inv_reference, i.estimated_value, i.condition_label, i.authenticity_status, i.category,
      r.client_name, r.looking_for_brand, r.looking_for_model, r.budget_usd, r.urgency
      FROM matches m
      JOIN inventory i ON m.inventory_id = i.id
      JOIN client_requests r ON m.request_id = r.id
      WHERE m.id = ?`).bind(id).first()
    if (!match) return c.json({ error: 'Not found' }, 404)
    return c.json(match)
  } catch (err: any) {
    return c.json({ error: 'Server error' }, 500)
  }
})

// PUT /api/matching/:id/accept — accept a match
app.put('/:id/accept', requireAuth, async (c) => {
  try {
    const id = c.req.param('id')
    const match = await c.env.DB.prepare('SELECT * FROM matches WHERE id = ?').bind(id).first()
    if (!match) return c.json({ error: 'Not found' }, 404)

    const now = new Date().toISOString()

    // Update match status
    await c.env.DB.prepare('UPDATE matches SET match_status = ? WHERE id = ?').bind('accepted', id).run()

    // Update the request to matched
    await c.env.DB.prepare('UPDATE client_requests SET status = ?, updated_at = ? WHERE id = ?').bind('matched', now, match.request_id).run()

    return c.json({ success: true, id, match_status: 'accepted' })
  } catch (err: any) {
    return c.json({ error: 'Server error' }, 500)
  }
})

// PUT /api/matching/:id/reject — reject a match
app.put('/:id/reject', requireAuth, async (c) => {
  try {
    const id = c.req.param('id')
    const match = await c.env.DB.prepare('SELECT * FROM matches WHERE id = ?').bind(id).first()
    if (!match) return c.json({ error: 'Not found' }, 404)

    await c.env.DB.prepare('UPDATE matches SET match_status = ? WHERE id = ?').bind('rejected', id).run()
    return c.json({ success: true, id, match_status: 'rejected' })
  } catch (err: any) {
    return c.json({ error: 'Server error' }, 500)
  }
})

// GET /api/matching/stats/summary — matchmaking stats
app.get('/stats/summary', async (c) => {
  try {
    const db = c.env.DB
    const total = await db.prepare('SELECT COUNT(*) as c FROM matches').first()
    const byStatus = await db.prepare('SELECT match_status, COUNT(*) as c FROM matches GROUP BY match_status').all()
    const avgScore = await db.prepare('SELECT AVG(overall_score) as avg FROM matches').first()
    const topMatches = await db.prepare(
      `SELECT m.*, i.brand as inv_brand, i.model as inv_model, r.client_name, r.looking_for_brand, r.looking_for_model
       FROM matches m JOIN inventory i ON m.inventory_id = i.id JOIN client_requests r ON m.request_id = r.id
       WHERE m.match_status = 'pending' ORDER BY m.overall_score DESC LIMIT 5`
    ).all()

    return c.json({
      totalMatches: total?.c || 0,
      avgScore: avgScore?.avg ? Math.round(avgScore.avg) : 0,
      byStatus: byStatus.results,
      topMatches: topMatches.results
    })
  } catch (err: any) {
    return c.json({ error: 'Server error' }, 500)
  }
})

export default app
