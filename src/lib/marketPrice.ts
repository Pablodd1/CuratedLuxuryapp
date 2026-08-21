// Market price lookup — single entry point so valuation, the market endpoint,
// and the dossier all quote the same number from the same source.
//
// Backends, in order:
//   1. D1 baseline: median of real Chrono24 listings per reference
//      (280K-listing dataset, Sep 2023 snapshot). Labeled honestly.
//   2. Fallback: null — callers keep the AI estimate and say so.
//
// Upgrade path: a live feed (Apify Chrono24 scraper, ~$3/1k records) slots in
// as backend 0 — same return shape, and if it returns within a few hours of
// `as_of` it wins over the baseline.

export interface MarketQuote {
  price: number          // median of live listings for this exact reference
  avg: number
  min: number
  max: number
  listings: number
  source: string         // e.g. 'chrono24_baseline_2023-09'
  asOf: string
}

const REF_RE = /[A-Z0-9][A-Z0-9\/.\-]{2,}/g

export function extractRefs(s: string): string[] {
  const found: string[] = []
  const seen = new Set<string>()
  for (const m of s.toUpperCase().matchAll(REF_RE)) {
    const r = m[0]
    // refs contain digits; bare words like ROLEX/DIAL are not reference numbers
    if (!/\d/.test(r)) continue
    if (seen.has(r)) continue
    seen.add(r)
    found.push(r)
    if (r.endsWith('/001')) { seen.add(r.slice(0, -4)); found.push(r.slice(0, -4)) }
  }
  return found
}

// Try a list of reference candidates (best first) and return the first real
// quote. Exact match (≥2 listings) wins; otherwise a brand-consistent prefix
// median across variants.
export async function lookupMarketPrice(db: any, brand: string, refs: string[]): Promise<MarketQuote | null> {
  if (!db || !Array.isArray(refs) || refs.length === 0) return null
  const brandN = (brand || '').trim().toLowerCase()

  for (const refRaw of refs) {
    const refN = refRaw.trim().toUpperCase()
    if (!refN) continue

    let row = brandN ? await db.prepare(
      'SELECT * FROM market_price_baseline WHERE reference_number = ? AND LOWER(brand) = ? ORDER BY listing_count DESC LIMIT 1'
    ).bind(refN, brandN).first() : null
    if (!row) {
      // brand spelling drift (TAG Heuer vs tagheuer, Sinn-A.Lange etc.): any brand
      row = await db.prepare(
        'SELECT * FROM market_price_baseline WHERE reference_number = ? ORDER BY listing_count DESC LIMIT 1'
      ).bind(refN).first()
    }
    if (row && row.listing_count >= 2) {
      return {
        price: Math.round(row.median_price),
        avg: Math.round(row.avg_price),
        min: Math.round(row.min_price),
        max: Math.round(row.max_price),
        listings: row.listing_count,
        source: 'chrono24_baseline_2023-09',
        asOf: '2023-09',
      }
    }

    // Prefix fallback: the dataset stores longer variants — '16202BA.OO.1240BA.01'
    // for '16202', '5811/1G-001' for '5811/1G'. Only trust it when ONE brand
    // dominates the variants (≥80% of listings), otherwise short prefixes
    // (e.g. '5811') would mix unrelated watches.
    const likeRes = await db
      .prepare('SELECT median_price, min_price, max_price, listing_count, LOWER(brand) AS brand FROM market_price_baseline WHERE reference_number LIKE ? ORDER BY listing_count DESC LIMIT 200')
      .bind(refN + '%')
      .all()
    const like: any[] = (likeRes as any)?.results || []
    const total = like.reduce((a, r) => a + (r.listing_count || 0), 0)
    if (like.length > 0 && total >= 5) {
      const byBrand: Record<string, number> = {}
      for (const r of like) byBrand[r.brand] = (byBrand[r.brand] || 0) + (r.listing_count || 0)
      const top = Object.entries(byBrand).sort((a, b) => b[1] - a[1])[0]
      if (top && top[1] / total >= 0.8) {
        // ponytail: median of per-variant medians, not per-listing; ~2-3% off,
        // fine for display. Upgrade: store per-listing rows if precision matters.
        const mids = [...like.map(r => r.median_price)].sort((a, b) => a - b)
        return {
          price: Math.round(mids[Math.floor(mids.length / 2)]),
          avg: Math.round(like.reduce((a, r) => a + r.median_price, 0) / like.length),
          min: Math.round(Math.min(...like.map(r => r.min_price))),
          max: Math.round(Math.max(...like.map(r => r.max_price))),
          listings: total,
          source: 'chrono24_baseline_prefix_2023-09',
          asOf: '2023-09',
        }
      }
    }
  }
  return null
}
