import { Hono } from 'hono'
import { searchWatchCatalog, LUXURY_CATALOG } from '../../lib/watchCatalog'

const app = new Hono()

// GET /api/autocomplete/search?q=...&category=...
app.get('/search', (c) => {
  const q = c.req.query('q') || ''
  const category = c.req.query('category') || ''
  const results = searchWatchCatalog(q, category)
  return c.json({
    query: q,
    count: results.length,
    results: results.map(item => ({
      id: item.id,
      brand: item.brand,
      model: item.model,
      referenceNumber: item.referenceNumber,
      category: item.category,
      caseMaterial: item.caseMaterial || '',
      caseSizeMm: item.caseSizeMm || null,
      movement: item.movement || '',
      braceletType: item.braceletType || '',
      baselineMarketValueUSD: item.baselineMarketValueUSD,
      forensicIndicators: item.forensicIndicators
    }))
  })
})

// GET /api/autocomplete/details?ref=...
app.get('/details', (c) => {
  const ref = (c.req.query('ref') || '').toLowerCase().trim()
  const matched = LUXURY_CATALOG.find(i => i.referenceNumber.toLowerCase() === ref || i.id.toLowerCase() === ref)
  if (!matched) {
    return c.json({ found: false, error: 'Reference not found in catalog' }, 404)
  }
  return c.json({ found: true, item: matched })
})

export default app
