import { Hono } from 'hono'
import { queryVectorRAG } from '../../lib/vectorizeRAG'
import { LUXURY_CATALOG } from '../../lib/watchCatalog'

export const ragRoutes = new Hono()

// POST /api/rag/search — Perform vector search against catalog embeddings
ragRoutes.post('/search', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    const query = body.query || body.prompt || ''
    const category = body.category || 'all'
    const topK = body.topK ? parseInt(body.topK) : 5

    if (!query || query.trim().length === 0) {
      return c.json({ error: 'Query parameter required for vector search' }, 400)
    }

    const results = queryVectorRAG(query, category, topK)

    return c.json({
      success: true,
      query,
      category,
      total_matches: results.length,
      matches: results.map(r => ({
        id: r.item.id,
        brand: r.item.brand,
        model: r.item.model,
        referenceNumber: r.item.referenceNumber,
        category: r.item.category,
        baselineMarketValueUSD: r.item.baselineMarketValueUSD,
        similarityScore: r.similarityScore,
        matchConfidence: r.matchConfidence,
        forensicChecklist: r.forensicChecklist,
        details: r.item
      }))
    })
  } catch (err: any) {
    return c.json({ error: 'Vector search failed', message: err.message }, 500)
  }
})

// GET /api/rag/index — Dump vector index stats
ragRoutes.get('/index', (c) => {
  return c.json({
    status: 'online',
    engine: 'Edge Cosine Similarity TF-IDF 128D Vectorizer',
    total_indexed_items: LUXURY_CATALOG.length,
    categories: ['Watches', 'Handbags', 'Fine Jewelry', 'Luxury Vehicles', 'Art & Collectibles']
  })
})
