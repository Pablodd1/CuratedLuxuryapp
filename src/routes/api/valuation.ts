import { Hono } from 'hono'
import { optionalAuth, type User } from '../../lib/auth'
import { queryVectorRAG } from '../../lib/vectorizeRAG'

// ── Luxury Editorial Dataset (2025 Market Edition) ──────────────────────────
const LUXURY_DATASET = [
  { keywords: ['submariner', 'rolex', '126610', 'oystersteel'], brand: 'Rolex', model: 'Submariner Date 126610LN', category: 'Watches', referenceNumber: '126610LN', estimatedValue: 14200, confidence: 96, reasoning: 'Ceramic bezel structure and dial markers align with 41mm Oystersteel Submariner 126610LN catalog specifications.' },
  { keywords: ['daytona', 'cosmograph', '116500', '126500'], brand: 'Rolex', model: 'Cosmograph Daytona 126500LN', category: 'Watches', referenceNumber: '126500LN', estimatedValue: 34800, confidence: 97, reasoning: 'Tri-compax dial geometry and Cerachrom tachymeter bezel verified against luxury watch editorial dataset.' },
  { keywords: ['patek', 'nautilus', '5711', '5811'], brand: 'Patek Philippe', model: 'Nautilus 5811/1G-001', category: 'Watches', referenceNumber: '5811/1G-001', estimatedValue: 145000, confidence: 98, reasoning: '41mm 18k white gold case and blue sunburst dial matched against Patek Philippe archives.' },
  { keywords: ['audemars', 'piguet', 'royal oak', '15500', '16202'], brand: 'Audemars Piguet', model: 'Royal Oak Extra-Thin 16202ST', category: 'Watches', referenceNumber: '16202ST.OO.1240ST.01', estimatedValue: 68000, confidence: 96, reasoning: 'Petite Tapisserie dial, octagonal bezel with 8 exposed screws, Calibre 7121 signature verified.' },
  { keywords: ['richard', 'mille', 'rm', '11-03', 'tonneau'], brand: 'Richard Mille', model: 'RM 11-03 Flyback Chronograph', category: 'Watches', referenceNumber: 'RM11-03 TI', estimatedValue: 220000, confidence: 97, reasoning: 'Calibre RMAC3, NTPT carbon/titanium tonneau case geometry authenticated.' },
  { keywords: ['birkin', 'hermes', 'hermès', 'epsom'], brand: 'Hermès', model: 'Birkin 30 Black Epsom GHW', category: 'Handbags', referenceNumber: 'HER-BIR-30-EPS', estimatedValue: 24500, confidence: 98, reasoning: 'Hermès Paris foil stamping, turn-lock sangles, and Epsom leather grain matched.' },
  { keywords: ['kelly', 'hermes', 'sellier', 'crocodile'], brand: 'Hermès', model: 'Kelly 25 Sellier Croc Porosus', category: 'Handbags', referenceNumber: 'HER-KEL-25-CRO', estimatedValue: 68000, confidence: 99, reasoning: 'Porosus crocodile square scale symmetry, blind stamp date mark, gold hardware verified.' },
  { keywords: ['cartier', 'love', 'bracelet', 'gold'], brand: 'Cartier', model: 'Love Bracelet 18K Yellow Gold', category: 'Fine Jewelry', referenceNumber: 'B6035517', estimatedValue: 7800, confidence: 96, reasoning: 'Cartier signature serial engraving and motif screw spacing confirmed.' },
  { keywords: ['ferrari', 'sf90', 'stradale'], brand: 'Ferrari', model: 'SF90 XX Stradale', category: 'Luxury Vehicles', referenceNumber: 'FER-SF90-XX-2025', estimatedValue: 980000, confidence: 99, reasoning: 'Active carbon fiber rear wing, twin-turbo V8 hybrid setup verified.' },
  { keywords: ['porsche', '911', 'gt3', 'rs', '992'], brand: 'Porsche', model: '911 GT3 RS (992)', category: 'Luxury Vehicles', referenceNumber: 'POR-992-GT3RS-W', estimatedValue: 465000, confidence: 97, reasoning: 'Top-mounted DRS wing, magnesium center-lock wheels, carbon weave confirmed.' },
  { keywords: ['bugatti', 'chiron', 'w16'], brand: 'Bugatti', model: 'Chiron Pur Sport', category: 'Luxury Vehicles', referenceNumber: 'BUG-CHI-PS-2025', estimatedValue: 4200000, confidence: 99, reasoning: 'Horseshoe grille ratio, C-bar side profile, exposed 3D printed titanium exhaust tips matched.' },
]

function keywordMatch(text: string): { item: (typeof LUXURY_DATASET)[number]; score: number; strong: boolean } | null {
  const lower = text.toLowerCase()
  let best: (typeof LUXURY_DATASET)[number] | null = null
  let bestScore = 0
  for (const item of LUXURY_DATASET) {
    const score = item.keywords.filter(k => lower.includes(k)).length
    if (score > bestScore) { bestScore = score; best = item }
  }
  if (!best || bestScore < 1) return null
  // STRONG = multiple keyword hits including a model-level identifier (e.g.
  // 'submariner', 'birkin', 'sf90' — not just the brand name). Brand-only
  // matches ('cartier' alone) are WEAK: the dataset entry may describe a
  // completely different product than the user's item.
  const MODEL_WORDS = ['submariner','daytona','cosmograph','nautilus','royal oak','rm ','11-03','tonneau',
    'birkin','kelly','sellier','crocodile','love','bracelet','sf90','stradale','911','gt3','992',
    'chiron','pur sport','w16','126610','116500','126500','5711','5811','15500','16202']
  // word-boundary match for short tokens (rs/gt3) so they don't substring-match
  // inside other words ('rs' ⊂ 'audemars')
  const hasModelWord = MODEL_WORDS.some(w => lower.includes(w))
    || /\b(rs|gt3)\b/.test(lower)
  const isBrandOnly = bestScore === 1 && !hasModelWord
  // STRONG requires a model-level identifier in the user text. Without one,
  // multi-word brand names ('audemars piguet') and generic keywords
  // ('cartier' + 'gold') would still fake a confident match.
  return { item: best, score: bestScore, strong: hasModelWord && !isBrandOnly && bestScore >= 2 }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function extractJSON(text: string): any | null {
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) return null
  try { return JSON.parse(m[0]) } catch { return null }
}

function cleanBase64(b64: string): { data: string; mimeType: string } {
  const cleaned = b64.replace(/^data:image\/\w+;base64,/, '')
  const mimeMatch = b64.match(/data:(image\/\w+);base64/)
  return { data: cleaned, mimeType: mimeMatch?.[1] || 'image/jpeg' }
}

// ── AI GUARDRAILS: brand-material contradiction + hallucination detection ──
const GUARDRAIL_RULES: { brands: string[]; check: (r: any) => string | null }[] = [
  { brands: ['Hermès', 'Hermes', 'hermes', 'hermès'],
    check: (r) => {
      const m = (r.reasoning || '').toLowerCase()
      if (m.includes('synthetic') || m.includes('faux leather') || m.includes('vegan leather') || m.includes('pu leather'))
        return 'CONTRADICTION: Hermès does not use synthetic materials. If leather appears synthetic, item is likely counterfeit.'
      if (r.model?.toLowerCase().includes('birkin') && (r.estimatedValue || 0) < 5000)
        return 'VALUE ANOMALY: Authentic Birkin bags trade above $10,000. Valuation may be hallucinated.'
      return null
    }
  },
  { brands: ['Rolex', 'rolex'],
    check: (r) => {
      if (r.condition_label === 'Mint' && (r.year || 0) > 0 && r.year < 2000)
        return 'CONDITION ANOMALY: Pre-2000 Rolex marked Mint without service papers. Flag for verification.'
      if (r.confidence > 90 && (r.estimatedValue || 0) < 1000)
        return 'VALUE ANOMALY: High-confidence Rolex valuation below $1,000. Likely hallucinated or fake.'
      return null
    }
  },
  { brands: ['Patek Philippe', 'Patek', 'patek'],
    check: (r) => {
      if (r.estimatedValue > 500000 && r.confidence < 30)
        return 'VALUE ANOMALY: Extreme valuation with low confidence. Requires human review.'
      return null
    }
  },
  { brands: ['Cartier', 'cartier'],
    check: (r) => {
      const m = (r.reasoning || '').toLowerCase()
      if (m.includes('plated') || m.includes('gold plated') || m.includes('gold-filled'))
        return 'CONTRADICTION: Cartier fine jewelry is solid precious metal, not plated. Suspect counterfeit.'
      return null
    }
  },
  { brands: ['Richard Mille', 'Richard', 'mille'],
    check: (r) => {
      if (r.estimatedValue > 0 && r.estimatedValue < 50000)
        return 'VALUE ANOMALY: Authentic Richard Mille pieces trade above $50,000. Valuation suspect.'
      return null
    }
  },
  // Generic catch-all for extreme anomalies
  { brands: ['*'],
    check: (r) => {
      if (r.confidence > 95 && !r.referenceNumber && !r.reasoning)
        return 'CONFIDENCE ANOMALY: Very high confidence without reference number or reasoning. Likely hallucinated.'
      if (r.estimatedValue > 1_000_000 && r.confidence < 20)
        return 'VALUE ANOMALY: Million-dollar valuation with near-zero confidence. Rejected.'
      return null
    }
  },
]

function applyGuardrails(result: any): string[] {
  const warnings: string[] = []
  for (const rule of GUARDRAIL_RULES) {
    const brand = (result.brand || '').toLowerCase()
    const matchesBrand = rule.brands.includes('*') || rule.brands.some(b => brand.includes(b.toLowerCase()))
    if (!matchesBrand) continue
    const warning = rule.check(result)
    if (warning) {
      warnings.push(warning)
      result.red_flags = [...(result.red_flags || []), warning]
    }
  }
  // Downgrade confidence if guardrails triggered
  if (warnings.length >= 3) {
    result.confidence = Math.min(result.confidence || 0, 35)
    result.authenticityStatus = 'REQUIRES IN-PERSON VERIFICATION'
  } else if (warnings.length >= 1) {
    result.confidence = Math.min(result.confidence || 0, 60)
  }
  return warnings
}

// ── VISION MODEL ─────────────────────────────────────────────────────────────
const VISION_MODEL = 'gemini-3.6-flash'  // Upgraded 2026: 2x cheaper than 3.5-flash ($0.75/$3.75 vs $1.50/$9.00), later flash generation

const VISION_PROMPT = `You are CuratedLux AI — a world-class luxury authentication engine for watches, handbags, jewelry, vehicles, and art/collectibles. Gemini 3.6 Flash edition.

Analyze this image with forensic precision. You are evaluating authenticity, condition, and market value.

For WATCHES, examine: dial typography, logo placement/kerning, bezel geometry, crown shape, bracelet link structure, caseback engravings, lume color, cyclops magnification, rehaut alignment.

For HANDBAGS, examine: leather grain pattern, stitching tension/spacing, hardware weight/engraving, heat stamp depth/alignment, zipper pull shape, date code format, edge paint thickness.

For JEWELRY, examine: hallmark stamps, metal color consistency, gemstone cut/faceting, setting prong symmetry, clasp mechanism, weight proportions.

For VEHICLES, examine: badge placement, body panel gaps, wheel design, interior stitching pattern, VIN plate location/font, carbon weave pattern.

For ART & COLLECTIBLES, examine: signature position/style, canvas texture, frame construction, provenance markings, edition numbering.

Return ONLY this JSON (no markdown, no explanation):
{
  "category": "Watches" | "Handbags" | "Fine Jewelry" | "Luxury Vehicles" | "Art & Collectibles",
  "brand": "exact brand name",
  "model": "exact model name with reference if visible",
  "referenceNumber": "reference number from dial/caseback/certificate",
  "year": 2024 or null,
  "condition_grade": 0-4 (0=Poor, 1=Fair, 2=Good, 3=Excellent, 4=Mint/NOS),
  "condition_label": "Mint" | "Excellent" | "Good" | "Fair" | "Poor",
  "estimatedValue": number (USD, current secondary market as of 2026),
  "currency": "USD",
  "confidence": 0-100,
  "authenticityStatus": "AUTHENTIC MATCH" | "REQUIRES IN-PERSON VERIFICATION" | "INCONCLUSIVE" | "SUSPECT COUNTERFEIT",
  "reasoning": "detailed forensic breakdown citing specific visual evidence observed",
  "confidence_breakdown": {
    "logo": 0-100,
    "serial": 0-100,
    "materials": 0-100,
    "bezel_geometry": 0-100,
    "dial_texture": 0-100,
    "overall_proportion": 0-100
  },
  "inclusions": ["Box", "Papers", "Hang Tag"] or [],
  "red_flags": ["Mismatched lume color", "Incorrect crown geometry"] or []
}`

// ── OCR PROMPT for certificates, barcodes, serials ───────────────────────────
const OCR_PROMPT = `Extract ALL text, serial numbers, barcodes, dates, and reference numbers from this image. This may be a warranty card, certificate, box label, hang tag, or caseback.

Return ONLY this JSON:
{
  "serial_number": "extracted serial or null",
  "reference_number": "extracted reference number or null",
  "barcode_value": "barcode number if visible or null",
  "dates": ["2024-03-15", ...],
  "retailer_name": "retailer stamp if visible or null",
  "all_text": "full extracted text block"
}`

// ── VOICE TRANSCRIPT PARSER PROMPT ───────────────────────────────────────────
const VOICE_PROMPT = (transcript: string) => `Extract luxury asset listing details from this spoken description: "${transcript}"

Return ONLY JSON:
{
  "category": "Watches|Handbags|Fine Jewelry|Art & Collectibles|Luxury Vehicles",
  "brand": "extracted brand",
  "model": "extracted model",
  "referenceNumber": "extracted reference if mentioned",
  "year": null or number,
  "condition_grade": 0-4,
  "condition_label": "Mint|Excellent|Good|Fair|Poor",
  "estimatedValue": number (if price mentioned),
  "currency": "USD",
  "description": "normalized summary of the listing"
}`

// ── ROUTER ───────────────────────────────────────────────────────────────────
const app = new Hono<{ Bindings: { DB?: D1Database; GEMINI_API_KEY?: string; FIREWORKS_API_KEY?: string; AUTH_SECRET?: string }; Variables: { user: User | null } }>()

// All endpoints are public — but we capture the current user if a session/bearer is present
app.use('*', optionalAuth)

// ── Audit H1: request guards ────────────────────────────────────────────────
// In-memory per-isolate rate limiter (Workers): not perfect across colos but
// stops simple loops. 10 analyzes/min/IP for anonymous, 30/min for authed.
const rlBucket = new Map<string, { n: number; ts: number }>()
function rateLimited(key: string, max: number): boolean {
  const now = Date.now()
  const b = rlBucket.get(key)
  if (!b || now - b.ts > 60_000) { rlBucket.set(key, { n: 1, ts: now }); return false }
  b.n++
  return b.n > max
}
function imagesGuard(list: string[] | undefined, maxCount: number, maxB64Len: number): boolean {
  if (!list) return false
  if (list.length > maxCount) return true
  return list.some(x => typeof x !== 'string' || x.length > maxB64Len)
}

// ── NORMALIZE: merge multiple AI outputs into one canonical form ─────────────
function normalizeResults(vision: any, ocrTexts: string[], voice: any, description: string): any {
  const result: any = {
    category: vision?.category || voice?.category || 'Watches',
    brand: vision?.brand || voice?.brand || '',
    model: vision?.model || voice?.model || '',
    referenceNumber: vision?.referenceNumber || voice?.referenceNumber || '',
    year: vision?.year || voice?.year || null,
    condition_grade: vision?.condition_grade ?? voice?.condition_grade ?? 3,
    condition_label: vision?.condition_label || voice?.condition_label || 'Good',
    estimatedValue: vision?.estimatedValue || voice?.estimatedValue || 0,
    currency: vision?.currency || 'USD',
    confidence: vision?.confidence || 0,
    authenticityStatus: vision?.authenticityStatus || 'PENDING',
    reasoning: vision?.reasoning || '',
    confidence_breakdown: vision?.confidence_breakdown || { logo: 0, serial: 0, materials: 0, bezel_geometry: 0, dial_texture: 0, overall_proportion: 0 },
    inclusions: vision?.inclusions || [],
    red_flags: vision?.red_flags || [],
    ocr_texts: [] as string[],
    ocr_serials: [] as string[],
    ocr_barcodes: [] as string[],
    ocr_dates: [] as string[],
    voice_description: voice?.description || '',
  }

  // Merge OCR data
  for (const raw of ocrTexts) {
    const ocr = extractJSON(raw)
    if (!ocr) { result.ocr_texts.push(raw); continue }
    if (ocr.serial_number) result.ocr_serials.push(ocr.serial_number)
    if (ocr.reference_number && !result.referenceNumber) result.referenceNumber = ocr.reference_number
    if (ocr.barcode_value) result.ocr_barcodes.push(ocr.barcode_value)
    if (ocr.dates?.length) result.ocr_dates.push(...ocr.dates)
    if (ocr.all_text) result.ocr_texts.push(ocr.all_text)
  }

  // If OCR found a serial but vision didn't, boost confidence
  if (result.ocr_serials.length > 0 && !vision?.serial) {
    result.confidence_breakdown.serial = Math.min(100, (result.confidence_breakdown.serial || 40) + 30)
  }

  // If voice gave a price and vision didn't
  if (!result.estimatedValue && voice?.estimatedValue) {
    result.estimatedValue = voice.estimatedValue
  }

  // If description has brand/model keywords, use as fallback
  if ((!result.brand || result.brand === 'Unknown') && description) {
    const match = keywordMatch(description)
    if (match) {
      result.brand = match.item.brand
      result.model = match.item.model
      result.referenceNumber = result.referenceNumber || match.item.referenceNumber
      result.category = match.item.category
    }
  }

  return result
}

// ── ROUTER ───────────────────────────────────────────────────────────────────
// (already declared at top — see line ~117)

// POST /api/valuation/analyze — MULTI-MODAL VALUATION PIPELINE
//   Accepts: { images: ["b64...", "b64...", ...], transcript?: "...", description?: "..." }
//   Image 0  → Gemini Vision (brand, model, condition, value)
//   Images 1+ → PaddleOCR via Fireworks (serials, barcodes, certs, box labels)
//   Transcript → Gemini Voice parser (structured fields from speech)
//   Falls back to keyword dataset when Gemini unavailable
app.post('/analyze', async (c) => {
  const startTs = Date.now()
  try {
    const body = await c.req.json<{
      images?: string[]
      imageBase64?: string  // legacy single-image support
      transcript?: string
      description?: string
      source?: 'camera' | 'voice' | 'manual' | 'embed'
      shotTiers?: string[]  // per-image accuracy tier: hero | macro | detail | standard
    }>()

    // ── Abuse caps (audit H1) ────────────────────────────────────────────────
    // Unauthenticated callers may still try the pipeline, but with a small
    // quota so a script loop can't drain the Gemini/Fireworks budget.
    const user: any = c.get('user')
    const MAX_IMAGES = 5
    const MAX_IMG_B64 = 4 * 1024 * 1024 // ~3MB binary per image
    const rlKey = `analyze:${user?.id || c.req.header('cf-connecting-ip') || 'anon'}`
    if (rateLimited(rlKey, user ? 30 : 10)) {
      return c.json({ error: 'rate_limited', message: 'Too many analyses — wait a minute' }, 429)
    }
    const rawImages = [...(body.images || []), ...(body.imageBase64 && !(body.images || []).includes(body.imageBase64) ? [body.imageBase64] : [])]
    if (imagesGuard(rawImages, MAX_IMAGES, MAX_IMG_B64)) {
      return c.json({ error: 'payload_too_large', message: `Max ${MAX_IMAGES} images, ~3MB each` }, 413)
    }

    // Normalize: support both single legacy param and multi-image array
    const images: string[] = body.images || []
    if (body.imageBase64 && !images.includes(body.imageBase64)) {
      images.unshift(body.imageBase64)
    }

    const { transcript, description } = body
    const searchText = (description || transcript || '').toLowerCase().trim()
    const apiKey = c.env.GEMINI_API_KEY as string | undefined
    const fireworksKey = c.env.FIREWORKS_API_KEY as string | undefined

    // ── Variable containers ──────────────────────────────────────────────────
    let visionResult: any = null
    const ocrResults: string[] = []
    let voiceResult: any = null

    // ── Stage 1: Gemini 3.6 Flash Vision (hero + macro shots together) ───────
    // Accuracy lever: send ALL useful images to vision, not just the hero.
    // The macro/serial close-up carries the strongest authenticating signal and
    // feeding it to the same model sharpens brand/model/serial extraction.
    if (apiKey && images.length > 0) {
      try {
        // Hero first, then up to 3 macro/detail shots (cap for cost/latency)
        const visionImages = images.slice(0, Math.min(4, images.length))
        const parts: any[] = [
          { text: VISION_PROMPT + '\n\nYou are given multiple photos of the SAME item (hero + macro close-ups of serials/hallmarks/dial). Fuse them: the macro shots carry the serial, reference and hallmark — use them to FIRM UP the serial, referenceNumber and authenticity verdict. If a macro shows a serial, report it exactly.' }
        ]
        for (const img of visionImages) {
          const { data, mimeType } = cleanBase64(img)
          parts.push({ inlineData: { mimeType, data } })
        }
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${VISION_MODEL}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
            })
          }
        )
        if (response.ok) {
          const respData = await response.json() as any
          const text = respData?.candidates?.[0]?.content?.parts?.[0]?.text || ''
          visionResult = extractJSON(text)
        }
      } catch (e) { console.error('Gemini Vision error:', e) }
    }

    // ── Stage 2: OCR (images 1+, or sole image if no Gemini) ─────────────────
    // Try PaddleOCR via Fireworks first, fall back to Gemini OCR
    for (let i = (visionResult ? 1 : 0); i < images.length; i++) {
      const { data, mimeType } = cleanBase64(images[i])

      // Try Fireworks PaddleOCR
      if (fireworksKey) {
        try {
          const fwResp = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${fireworksKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'accounts/fireworks/models/paddleocr-vl-1-6',
              messages: [{
                role: 'user',
                content: [
                  { type: 'text', text: OCR_PROMPT },
                  { type: 'image_url', image_url: { url: `data:${mimeType};base64,${data}` } }
                ]
              }],
              response_format: { type: 'json_object' },
              temperature: 0.0
            })
          })
          if (fwResp.ok) {
            const fwData = await fwResp.json() as any
            const content = fwData?.choices?.[0]?.message?.content || ''
            ocrResults.push(content)
            continue
          }
        } catch (e) { console.error('Fireworks OCR error:', e) }
      }

      // Fall back to Gemini for OCR if Fireworks unavailable
      if (apiKey) {
        try {
          const gemOcrResp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${VISION_MODEL}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: OCR_PROMPT }, { inlineData: { mimeType, data } }] }],
                generationConfig: { responseMimeType: 'application/json', temperature: 0.0 }
              })
            }
          )
          if (gemOcrResp.ok) {
            const gemData = await gemOcrResp.json() as any
            const text = gemData?.candidates?.[0]?.content?.parts?.[0]?.text || ''
            ocrResults.push(text)
          }
        } catch (e) { console.error('Gemini OCR error:', e) }
      }
    }

    // ── Stage 3: Voice transcript parsing ────────────────────────────────────
    if (apiKey && transcript) {
      try {
        const vResp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${VISION_MODEL}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: VOICE_PROMPT(transcript) }] }],
              generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
            })
          }
        )
        if (vResp.ok) {
          const vData = await vResp.json() as any
          const vText = vData?.candidates?.[0]?.content?.parts?.[0]?.text || ''
          voiceResult = extractJSON(vText)
        }
      } catch (e) { console.error('Gemini Voice error:', e) }
    }

    // ── Stage 4: Normalize & Merge ───────────────────────────────────────────
    const result = normalizeResults(visionResult, ocrResults, voiceResult, searchText)

    // ── Stage 4.5: AI Guardrails — brand contradiction + hallucination check ──
    const guardrailWarnings = applyGuardrails(result)
    if (guardrailWarnings.length > 0) {
      result.guardrail_warnings = guardrailWarnings
      console.log(`Guardrails triggered: ${guardrailWarnings.join('; ')}`)
    }

    // ── Stage 4.75: REFERENCE VERIFY-LOOP (AI proposes, curated data disposes) ─
    // Ground the model's brand/model/reference proposal against the live 22-entry
    // catalog via vector similarity. This confirms a genuine reference, surfaces
    // the closest curated entry + forensic checklist for the UI, and catches
    // brand-level contradictions (Model says Rolex, catalog thinks Hermès) →
    // route to human review instead of stamping a wrong AUTHENTIC.
    if (result.brand && result.brand !== 'Unknown') {
      try {
        const verifyQuery = [
          result.brand,
          result.model || '',
          result.referenceNumber || ''
        ].filter(Boolean).join(' ')
        const candidates = queryVectorRAG(verifyQuery, result.category || 'all', 5)
        const top = candidates[0]
        if (top) {
          const topBrand = (top.item.brand || '').toLowerCase().trim()
          const propBrand = (result.brand || '').toLowerCase().trim()
          // Normalize for brand comparison (strip accents/labels)
          const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
          const brandMatch = norm(topBrand) === norm(propBrand) ||
            norm(topBrand.split(' ')[0]) === norm(propBrand.split(' ')[0])
          const refMatch = result.referenceNumber &&
            top.item.referenceNumber.toLowerCase() === String(result.referenceNumber).toLowerCase()

          result.reference_match = {
            catalogId: top.item.id,
            brand: top.item.brand,
            model: top.item.model,
            referenceNumber: top.item.referenceNumber,
            category: top.item.category,
            baselineMarketValueUSD: top.item.baselineMarketValueUSD,
            similarity: top.similarityScore,
            matchConfidence: top.matchConfidence,
            forensicChecklist: top.forensicChecklist,
            brandMatches: brandMatch,
            referenceMatches: refMatch
          }

          // Confidence grounding rules (honesty guard — matches your "accuracy always best")
          if (brandMatch) {
            // AI proposal confirmed by a curated reference → reinforce confidence
            const catalogConfidence = top.matchConfidence
            // Blend: keep AI's reading but floor by catalog agreement
            result.confidence = Math.min(99, Math.max(result.confidence || 0, 50 + Math.round(catalogConfidence * 0.4)))
            if (refMatch && result.authenticityStatus === 'AUTHENTIC MATCH') {
              // Exact reference in catalog + AI authentic → strong confirmation
              result.confidence = Math.min(99, result.confidence + 4)
            }
            if (!result.reasoning) result.reasoning = `Matched against curated ${top.item.brand} ${top.item.model} reference (${top.item.referenceNumber}).`
          } else {
            // Brand-level CONTRADICTION: model + catalog disagree → do NOT stamp
            // authentic or auto-value; route to human review (per rules).
            result.reference_match.brandMatches = false
            result.confidence = Math.min(result.confidence || 100, 60)
            result.authenticityStatus = 'REVIEW_REQUIRED'
            result.estimatedValue = 0
            result.reasoning = (result.reasoning || '') + ` Caution: AI proposed "${result.brand} ${result.model || ''}" but the closest curated reference is ${top.item.brand} ${top.item.model}. Brand mismatch — manual verification required.`
          }
        }
      } catch (e) {
        // Verify-loop is an enhancement — never fail the pipeline on it.
        console.error('Reference verify-loop error:', e)
      }
    }

    // ── Stage 5: Keyword fallback if nothing came back ───────────────────────
    if ((!result.brand || result.brand === 'Unknown' || result.confidence === 0) && searchText) {
      const match = keywordMatch(searchText)
      if (match) {
        const m = match.item
        result.category = m.category
        result.brand = m.brand
        result.model = m.model
        result.referenceNumber = result.referenceNumber || m.referenceNumber
        if (match.strong) {
          // Multi-keyword model-level match — dataset identification stands.
          result.estimatedValue = m.estimatedValue
          result.confidence = m.confidence
          result.authenticityStatus = 'AUTHENTIC MATCH'
          result.reasoning = m.reasoning + ' (keyword-assisted identification)'
          result.confidence_breakdown = {
            logo: m.confidence - 2, serial: m.confidence - 4, materials: m.confidence - 1,
            bezel_geometry: m.confidence - 3, dial_texture: m.confidence - 2,
            overall_proportion: m.confidence - 1,
          }
        } else {
          // WEAK match (brand-only or single generic keyword): the dataset entry
          // may be a different product than the user's. NEVER stamp authentic or
          // auto-value — route to human review with capped confidence.
          result.estimatedValue = 0
          result.confidence = Math.min(m.confidence, 60)
          result.authenticityStatus = 'REVIEW_REQUIRED'
          result.reasoning = `Partial keyword match on "${m.brand}" (${match.score} keyword${match.score === 1 ? '' : 's'}). The identified model may not match your item — verify before posting. ` + (result.reasoning || '')
          result.confidence_breakdown = {
            logo: match.score * 20, serial: 0, materials: 0,
            bezel_geometry: 0, dial_texture: 0, overall_proportion: 0,
          }
        }
      }
    }

    // ── If still nothing — INSUFFICIENT_DATA (NEVER return random) ───────────
    if (!result.brand || result.brand === 'Unknown' || (result.confidence === 0 && !result.ocr_serials?.length)) {
      result.brand = 'Unknown'
      result.model = 'Please provide more details or a clearer image'
      result.confidence = 0
      result.authenticityStatus = 'INSUFFICIENT_DATA'
      result.reasoning = 'Could not identify the item from the provided images or text. For best results, upload a clear, well-lit photo of the item against a neutral background, plus any certificates, box labels, or serial number close-ups.'
      result.confidence_breakdown = { logo: 0, serial: 0, materials: 0, bezel_geometry: 0, dial_texture: 0, overall_proportion: 0 }
    }

    // ── Stage 5.5: Shot-tier accuracy weighting (user-provided shotTiers) ─────
    // Hero + macro images carry the authentication weight. If the user captured
    // a macro (serial/hallmark/date-code/VIN) macro shot, OR an OCR serial came
    // back, we can trust a keyword match more. If they skipped key macro shots
    // on a text-only guess, don't over-claim authenticity.
    const shotTiers: string[] = (body.shotTiers || []).filter((t: string) => t && t !== 'standard')
    const hasMacroShot = shotTiers.includes('macro') || shotTiers.includes('hero')
    const ocrStrong = (result.ocr_serials && result.ocr_serials.length > 0) || (result.ocr_barcodes && result.ocr_barcodes.length > 0)
    if (result.confidence > 0 && result.authenticityStatus === 'AUTHENTIC MATCH' && !ocrStrong) {
      // AUTHENTIC claimed without any OCR serial/barcode, no macro detail shot →
      // soften toward review (honesty guard). A description-only guess (no photos
      // at all) should NEVER claim AUTHENTIC MATCH.
      if (shotTiers.length === 0 && images.length === 0) {
        result.confidence = Math.min(result.confidence, 72)
        result.authenticityStatus = 'REVIEW_REQUIRED'
        result.reasoning = (result.reasoning || '') + ' (Estimate from description only — capture photos for authentication)'
      } else if (shotTiers.length > 0 && !hasMacroShot) {
        result.confidence = Math.min(result.confidence, 68)
        result.authenticityStatus = 'REVIEW_REQUIRED'
        result.reasoning = (result.reasoning || '') + ' (No macro/serial photo — manual verification advised)'
      } else if (shotTiers.length === 0) {
        result.confidence = Math.min(result.confidence, 72)
        result.reasoning = (result.reasoning || '') + ' (Photos present but no macro/serial verified)'
      }
    }
    if (ocrStrong || hasMacroShot) {
      // A macro or OCR serial is the strongest signal — nudge sub-confidence up.
      if (result.confidence_breakdown) {
        result.confidence_breakdown.serial = Math.min(100, (result.confidence_breakdown.serial || 0) + 5)
      }
    }

    // ── Stage 6: Store to D1 (inventory + scan_history) if confidence > 70 ───
    const shouldStore = result.confidence >= 70 || result.authenticityStatus === 'AUTHENTIC MATCH'
    let storedId: string | null = null
    if (shouldStore) {
      storedId = await storeValuation(c, result, body.source || 'camera')
    }

    // ── Add metadata ─────────────────────────────────────────────────────────
    result.id = storedId
    result.stored = !!storedId
    result.pipeline_ms = Date.now() - startTs
    result.images_processed = images.length
    result.ocr_images_processed = ocrResults.length
    result.has_voice = !!transcript
    result.source = visionResult ? 'gemini_vision' : (ocrResults.length > 0 ? 'ocr' : (searchText ? 'keyword_match' : 'insufficient_data'))

    return c.json(result)

  } catch (error: any) {
    return c.json({ error: error.message || 'Analysis failed', pipeline_ms: Date.now() - startTs }, 500)
  }
})

// POST /api/valuation/voice — dedicated voice transcript parser
app.post('/voice', async (c) => {
  try {
    const { transcript } = await c.req.json<{ transcript?: string }>()
    if (!transcript) return c.json({ error: 'Transcript required' }, 400)

    const apiKey = c.env.GEMINI_API_KEY
    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${VISION_MODEL}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: VOICE_PROMPT(transcript) }] }],
              generationConfig: { responseMimeType: 'application/json' }
            })
          }
        )
        if (response.ok) {
          const data = await response.json() as any
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
          const json = extractJSON(text)
          if (json) return c.json(json)
        }
      } catch { /* keyword fallback */ }
    }

    // Keyword fallback for voice
    const t = transcript.toLowerCase()
    let brand = 'Rolex', model = 'Submariner 126610LN', category = 'Watches', value = '13500'
    if (t.includes('birkin') || t.includes('herm')) { brand = 'Hermès'; model = 'Birkin 30 Epsom'; category = 'Handbags'; value = '22500' }
    else if (t.includes('cartier') || t.includes('love')) { brand = 'Cartier'; model = 'Love Bracelet 18k Gold'; category = 'Fine Jewelry'; value = '7300' }
    else if (t.includes('daytona')) { brand = 'Rolex'; model = 'Daytona 126500LN'; category = 'Watches'; value = '34800' }
    else if (t.includes('nautilus') || t.includes('patek')) { brand = 'Patek Philippe'; model = 'Nautilus 5811'; category = 'Watches'; value = '145000' }

    const numMatch = transcript.match(/(\d[\d,.]*)/)
    if (numMatch?.[1]) {
      const v = numMatch[1].replace(/,/g, '')
      if (!isNaN(Number(v)) && Number(v) > 100) value = v
    }

    return c.json({ category, brand, model, condition: 4, estimatedValue: value, currency: 'USD', description: transcript })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// POST /api/valuation/manual — category-aware manual form submission
//   Accepts structured form data: brand, model, category, and category-specific fields
//   Runs Gemini 3.5 Flash valuation from text-only description, stores to D1 if confidence >= 60
app.post('/manual', async (c) => {
  const startTs = Date.now()
  try {
    const body = await c.req.json<Record<string, any>>()
    const apiKey = c.env.GEMINI_API_KEY as string | undefined

    // Build a structured description from manual form fields
    const parts: string[] = []
    if (body.brand) parts.push(`Brand: ${body.brand}`)
    if (body.model) parts.push(`Model: ${body.model}`)
    if (body.reference_number) parts.push(`Reference: ${body.reference_number}`)
    if (body.serial_number) parts.push(`Serial: ${body.serial_number}`)
    if (body.case_material) parts.push(`Case: ${body.case_material}`)
    if (body.case_size_mm) parts.push(`Case Size: ${body.case_size_mm}mm`)
    if (body.movement) parts.push(`Movement: ${body.movement}`)
    if (body.bracelet_type) parts.push(`Bracelet: ${body.bracelet_type}`)
    if (body.leather_type) parts.push(`Leather: ${body.leather_type}`)
    if (body.hardware) parts.push(`Hardware: ${body.hardware}`)
    if (body.bag_size) parts.push(`Size: ${body.bag_size}`)
    if (body.color) parts.push(`Color: ${body.color}`)
    if (body.metal_purity) parts.push(`Metal: ${body.metal_purity}`)
    if (body.gemstone) parts.push(`Gemstone: ${body.gemstone}`)
    if (body.vin) parts.push(`VIN: ${body.vin}`)
    if (body.mileage_km) parts.push(`Mileage: ${body.mileage_km}km`)
    if (body.artist) parts.push(`Artist: ${body.artist}`)
    if (body.medium) parts.push(`Medium: ${body.medium}`)
    if (body.year) parts.push(`Year: ${body.year}`)
    if (body.condition_grade !== undefined) parts.push(`Condition Grade: ${body.condition_grade}/4`)
    if (body.purchase_price) parts.push(`Purchase Price: $${body.purchase_price}`)
    if (body.insurance_value) parts.push(`Insurance Value: $${body.insurance_value}`)
    if (body.box_papers) parts.push(`Box & Papers: ${body.box_papers}`)
    if (body.notes) parts.push(`Notes: ${body.notes}`)

    const category = body.category || 'Watches'
    const searchText = parts.join('. ')

    // ── Stage 1: Gemini 3.5 Flash text-only valuation ────────────────────────
    let visionResult: any = null
    if (apiKey && searchText) {
      try {
        const manualPrompt = `You are CuratedLux AI. A user has submitted the following structured details about a ${category} they own. Provide a market valuation and authenticity assessment based on this information alone. You do NOT have an image — use your market knowledge.

DETAILS: ${searchText}

Return ONLY this JSON:
{
  "category": "${category}",
  "brand": "confirm or correct the brand",
  "model": "confirm or correct the model",
  "referenceNumber": "reference number",
  "year": number or null,
  "condition_grade": 0-4,
  "condition_label": "Mint|Excellent|Good|Fair|Poor",
  "estimatedValue": number (USD, current 2026 secondary market),
  "currency": "USD",
  "confidence": 0-100 (lower than photo-based — 50-75 range typical for text-only),
  "authenticityStatus": "AUTHENTIC MATCH" | "REQUIRES IN-PERSON VERIFICATION" | "PENDING",
  "reasoning": "market analysis based on provided details",
  "confidence_breakdown": { "logo": 0, "serial": 0, "materials": 0, "bezel_geometry": 0, "dial_texture": 0, "overall_proportion": 0 },
  "inclusions": [],
  "red_flags": []
}`

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${VISION_MODEL}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: manualPrompt }] }],
              generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
            })
          }
        )
        if (response.ok) {
          const respData = await response.json() as any
          const text = respData?.candidates?.[0]?.content?.parts?.[0]?.text || ''
          visionResult = extractJSON(text)
        }
      } catch (e) { console.error('Manual valuation error:', e) }
    }

    // ── Stage 2: Build result from AI or fallback ───────────────────────────
    const result: any = {
      category,
      brand: body.brand || visionResult?.brand || 'Unknown',
      model: body.model || visionResult?.model || '',
      referenceNumber: body.reference_number || visionResult?.referenceNumber || '',
      year: body.year || visionResult?.year || null,
      condition_grade: body.condition_grade ?? visionResult?.condition_grade ?? 3,
      condition_label: visionResult?.condition_label || 'Good',
      estimatedValue: visionResult?.estimatedValue || body.insurance_value || body.purchase_price || 0,
      currency: 'USD',
      confidence: visionResult?.confidence || 60,
      authenticityStatus: visionResult?.authenticityStatus || 'PENDING',
      reasoning: visionResult?.reasoning || `Manual entry for ${body.brand || 'unknown'} ${body.model || 'item'}. Based on provided details.`,
      confidence_breakdown: visionResult?.confidence_breakdown || { logo: 0, serial: 0, materials: 0, bezel_geometry: 0, dial_texture: 0, overall_proportion: 0 },
      inclusions: [],
      red_flags: [],
      ocr_texts: [],
      ocr_serials: [],
      ocr_barcodes: [],
    }

    // ── Keyword fallback ────────────────────────────────────────────────────
    if ((!result.brand || result.brand === 'Unknown') && searchText) {
      const match = keywordMatch(searchText)
      if (match) {
        result.brand = match.brand
        result.model = match.model
        result.referenceNumber = match.referenceNumber
        result.estimatedValue = match.estimatedValue
        result.confidence = Math.max(result.confidence, match.confidence)
        result.reasoning = match.reasoning + ' (keyword-assisted)'
      }
    }

    // ── AI Guardrails for manual entries too ────────────────────────────────
    const mfWarnings = applyGuardrails(result)
    if (mfWarnings.length > 0) result.guardrail_warnings = mfWarnings

    // ── Store to D1 if confidence >= 60 (lower threshold for manual — no image) ─
    const shouldStore = result.confidence >= 60
    let storedId: string | null = null
    if (shouldStore) {
      storedId = await storeValuation(c, result, 'manual')
    }

    result.id = storedId
    result.stored = !!storedId
    result.pipeline_ms = Date.now() - startTs
    result.source = visionResult ? 'gemini_manual' : 'manual_form'

    return c.json(result)

  } catch (error: any) {
    return c.json({ error: error.message || 'Manual valuation failed', pipeline_ms: Date.now() - startTs }, 500)
  }
})

// ── STORE TO D1 ──────────────────────────────────────────────────────────────
async function storeValuation(c: any, result: any, source: string): Promise<string | null> {
  try {
    const db = c.env.DB as D1Database | undefined
    if (!db) return null
    const id = crypto.randomUUID()
    const cb = result.confidence_breakdown || {}
    const user = c.get('user')
    const ownerId = user?.id || 'system'
    await db.prepare(`INSERT INTO inventory (id, owner_id, category, brand, model, reference_number, year, condition_grade, condition_label, estimated_value, currency, confidence, authenticity_status, reasoning, confidence_logo, confidence_serial, confidence_materials, confidence_bezel, inclusions, image_count, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`)
      .bind(id, ownerId,
        result.category || 'Watches',
        result.brand || '',
        result.model || '',
        result.referenceNumber || '',
        result.year || null,
        result.condition_grade || 3,
        result.condition_label || 'Good',
        result.estimatedValue || 0,
        result.currency || 'USD',
        result.confidence || 0,
        result.authenticityStatus || 'PENDING',
        result.reasoning || '',
        cb.logo || 0, cb.serial || 0, cb.materials || 0, cb.bezel_geometry || 0,
        JSON.stringify(result.inclusions || []),
        (result.images_processed || result.image_count || 0),
      )
      .run()

    // Mirror to scan_history for end-user history view
    await db.prepare(
      `INSERT INTO scan_history
        (id, user_id, source, category, brand, model, reference_number, year,
         condition_grade, condition_label, estimated_value, currency, confidence,
         authenticity_status, reasoning, inclusions, red_flags, image_count,
         scan_payload, scan_source_host, inventory_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        crypto.randomUUID(),
        user?.id || null,
        source || 'manual',
        result.category || 'Watches',
        result.brand || '',
        result.model || '',
        result.referenceNumber || '',
        result.year || null,
        result.condition_grade || 3,
        result.condition_label || 'Good',
        result.estimatedValue || 0,
        result.currency || 'USD',
        result.confidence || 0,
        result.authenticityStatus || 'PENDING',
        result.reasoning || '',
        JSON.stringify(result.inclusions || []),
        JSON.stringify(result.red_flags || []),
        result.images_processed || result.image_count || 0,
        JSON.stringify(result),
        c.req.header('referer') || null,
        id,
        new Date().toISOString()
      )
      .run()

    // Fan out webhook for scan.created event (any subscribed webhooks for this user)
    try {
      const { fanOutEvent } = await import('../../lib/webhooks')
      await fanOutEvent(c, 'scan.created', {
        id,
        category: result.category,
        brand: result.brand,
        model: result.model,
        reference_number: result.referenceNumber,
        year: result.year,
        condition_grade: result.condition_grade,
        condition_label: result.condition_label,
        estimated_value: result.estimatedValue,
        currency: result.currency,
        confidence: result.confidence,
        authenticity_status: result.authenticityStatus,
        reasoning: result.reasoning,
        owner_id: ownerId,
        source,
        created_at: new Date().toISOString(),
      })
    } catch (e) { /* webhook fan-out is non-blocking */ }

    return id
  } catch (e) { /* non-critical — result still returned to user */ return null }
}

export default app
