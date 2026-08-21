import { Hono } from 'hono'
import { lookupMarketPrice, extractRefs } from '../../lib/marketPrice'

export const marketPriceRoutes = new Hono<{ Bindings: { DB?: any } }>()

// GET /api/market-prices?reference=126610LN[&brand=Rolex]
// Real median/min/max/listing-count for a reference from the 280K-listing
// Chrono24 baseline table. No DB or no data → price null (honest miss —
// the previous implementation fabricated trends from a charCode hash, which
// is worse than no data).
marketPriceRoutes.get('/', async (c) => {
  const db = c.env.DB
  const reference = c.req.query('reference')
  const brand = c.req.query('brand') || ''
  if (!reference) {
    return c.json({ success: false, error: 'reference query param required' }, 400)
  }
  if (!db) return c.json({ success: true, price: null, source: 'none', reason: 'db unavailable' })

  const refs = extractRefs(reference)
  const q = await lookupMarketPrice(db, brand, refs)
  return c.json({
    success: true,
    price: q?.price ?? null,
    avg: q?.avg ?? null,
    min: q?.min ?? null,
    max: q?.max ?? null,
    listings: q?.listings ?? 0,
    source: q?.source ?? 'none',
    asOf: q?.asOf ?? null,
    candidates: refs, // ref candidates tried by the lookup
  })
})
