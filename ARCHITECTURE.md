# CuratedLux Architecture Specification

## System Overview

CuratedLux is a production-grade luxury asset valuation platform. A user uploads
images (or speaks/texts a description), the AI pipeline extracts brand, model,
serial, materials, condition grade, and fair market value — then pre-fills a
confirmation form. The user reviews and confirms. Items enter authenticated
inventory. Client buy-requests are matched algorithmically. Tamper-evident
appraisal dossiers are generated on demand.

**Stack:** Hono 4.x → Cloudflare Workers (Pages) → D1 (SQLite) → Gemini 3.6 Flash

---

## 1. Accuracy Targets & Quality Gates

These are non-negotiable production thresholds. Every pipeline stage has a
defined accuracy contract — either met by the AI model, our fallback logic,
or the matching algorithm.

### 1.1 Vision Authentication (Gemini 3.6 Flash)

| Metric | Target | Measurement |
|---|---|---|
| Brand identification accuracy | ≥ 95% for top-5 luxury watch brands (Rolex, Patek, AP, RM, Cartier) | Human-verified test set of 200+ images per brand |
| Model + reference number | ≥ 90% for current-production models | Cross-reference against manufacturer catalogs |
| Condition grade (0-4) | Within ±1 grade of expert appraisal | Double-blind expert panel, n≥50 |
| Estimated market value | Within ±15% of Chrono24/WatchCharts median | Automated weekly benchmark pull |
| False positive rate (declares fake as authentic) | < 0.5% | Adversarial test set with known replicas |
| False negative rate (flags authentic as suspect) | < 5% | Must not reject genuine goods — tuned for recall over precision |
| Hallucination rate (returns data when no item present) | < 0.1% | Test on blank/irrelevant images weekly |

**Quality Gate:** `confidence ≥ 70` must be present to auto-store to inventory.
Below 70, the result is returned for human review but not persisted.

### 1.2 Keyword Fallback (when Gemini unavailable)

| Metric | Target |
|---|---|
| Correct brand/model from keyword set | ≥ 98% when matching keywords exist |
| INSUFFICIENT_DATA returned for unknown items | 100% — NEVER return random data |
| Confidence monotonic with keyword overlap | Verified in automated tests |

### 1.3 OCR Pipeline (PaddleOCR VL 1.6 — to be integrated)

| Metric | Target |
|---|---|
| Serial number extraction from casebacks | ≥ 92% character-level accuracy |
| Barcode/QR code detection | ≥ 99% detection rate |
| Warranty card date extraction | ≥ 95% |
| Box label reference number reading | ≥ 90% |

### 1.4 Voice-to-Form Pipeline

| Metric | Target |
|---|---|
| Brand extraction from speech | ≥ 90% |
| Model extraction | ≥ 85% |
| Budget/number extraction | ≥ 95% (numbers are easier than names) |
| End-to-end: voice → filled form | User confirms ≤ 3 fields on average |

### 1.5 Matching Algorithm

| Metric | Target |
|---|---|
| False positive matches (irrelevant items matched) | < 10% |
| Missed matches (good match not found) | < 15% |
| Overall match score correlation with expert judgment | r ≥ 0.80 |

---

## 2. Production Readiness Checklist

### 2.1 Infrastructure

- [x] Cloudflare Workers deployed (edge-native, global)
- [x] D1 database (SQLite, globally distributed) — 6 tables, 10 indexes
- [x] Zero external auth dependencies (no Firebase)
- [x] HTTPS by default (Cloudflare)
- [x] Health check endpoint (`/api/health`)
- [x] Gemini API key set as encrypted secret (`GEMINI_API_KEY` on Pages)
- [ ] PaddleOCR API key (Fireworks.ai) set as encrypted secret
- [ ] Custom domain binding (e.g., `app.curatedlux.com`)

### 2.2 Security

- [x] All API tokens server-side only — zero exposure to frontend
- [x] CORS middleware on `/api/*`
- [x] No hardcoded secrets in source (`.dev.vars` for local, secrets for prod)
- [x] `.gitignore` covers `.env`, `.dev.vars`, `.wrangler/`
- [ ] Rate limiting on `/api/valuation/analyze` (prevent abuse)
- [ ] Input validation: image size cap (10MB), MIME whitelist (image/jpeg, image/png, image/webp)
- [ ] Audit logging for all valuation/CRUD operations (activity_log table exists)
- [ ] Content Security Policy headers

### 2.3 Reliability

- [x] Graceful degradation: Gemini → keyword fallback → INSUFFICIENT_DATA
- [x] API errors return structured JSON, never crash
- [x] D1 operations wrapped in try/catch
- [ ] Retry logic for Gemini API (3 attempts, exponential backoff)
- [ ] Circuit breaker: if Gemini errors > 50% in 60s, go keyword-only
- [ ] D1 query timeout handling (Cloudflare Workers: 30s hard limit)

### 2.4 Observability

- [x] Hono logger middleware on `/api/*`
- [ ] Structured logging with request IDs
- [ ] Key metrics: valuation latency p50/p95/p99, Gemini success rate, fallback rate
- [ ] Error alerting threshold: Gemini failure rate > 20%, D1 errors > 0

### 2.5 Data Integrity

- [x] CHECK constraints on category, status, condition_grade, urgency, tier
- [x] Foreign key references on matches and dossiers
- [x] UUID primary keys (no guessable sequential IDs)
- [x] Soft-delete pattern (status='archived'/'cancelled', never DELETE)
- [x] ISO 8601 timestamps on all records
- [ ] Database backup schedule (daily exports via `gsk hosted d1_export`)
- [ ] Migration versioning discipline (every schema change = new migration file)

---

## 3. Scaling Strategy

### 3.1 Current Architecture Limits

| Component | Free Tier Limit | Paid Tier Limit |
|---|---|---|
| Cloudflare Worker CPU time | 10ms/request | 30ms/request (Bundled), 50ms (Unbound) |
| D1 storage | 5 GB | 50 GB+ (scales with plan) |
| D1 reads | 5M/month | 25M/month+ |
| D1 writes | 100K/month | 1M/month+ |
| Gemini API | $0.75/1M input, $3.75/1M output (gemini-3.6-flash) | Batch $0.375/$1.875; lite $0.30/$2.50 |
| Worker bundle size | 10 MB (compressed) | 10 MB |

### 3.2 Scale-up Triggers

| Trigger | Action |
|---|---|
| Worker CPU time > 25ms p95 | Move heavy computation to a separate Worker (Queues) |
| D1 reads > 4M/month | Add read cache layer (Workers KV or in-memory LRU in Worker) |
| D1 rows > 1M | Implement cursor-based pagination (already have limit/offset) |
| Gemini cost > $100/month | Batch process valuations, use cheaper model for pre-screening |
| > 100 concurrent users | Enable Cloudflare load balancing (automatic at edge) |
| Global latency complaints | Already edge-native — no change needed |
| > 10K inventory items | Add full-text search (D1 FTS5 or external search API) |

### 3.3 Scaling the AI Pipeline

**Phase 1 (current):** Single Gemini call per image. ~800ms-2s round trip.

**Phase 2 (next):** Split pipeline:
```
Image → Gemini Flash (fast: brand/model/category) → 400ms
Image → Gemini Flash (detailed: condition/materials/value) → 800ms (parallel)
Image → PaddleOCR (serial/barcode/cert text) → 300ms (parallel)
       ↓
  Merge & Normalize → 50ms
```
Total: ~850ms (parallel), down from ~2s sequential.

**Phase 3 (future):** Fine-tuned model on luxury-specific dataset.
- Train on 50K+ labeled luxury item images
- Deploy via Cloudflare Workers AI (LoRA adapter on Llama 3.2 Vision)
- Eliminates external API dependency, reduces latency to <200ms

### 3.4 Multi-Tenant Scaling

The current architecture is single-tenant (one worker, one D1). To go multi-tenant:

```
Current:  1 Worker → 1 D1 database
Future:   Dispatch Namespace → N Workers → N D1 databases
         (Workers for Platform handles routing)
```

Each dealer/enterprise gets their own worker instance + isolated D1.
The dispatch namespace (already configured: `user_website`) handles routing.

---

## 4. Data Flow Diagrams

### 4.1 Valuation Pipeline (Complete Flow)

```
USER                    BROWSER                 WORKER                  APIs
 │                        │                       │                      │
 │  Snap/upload image     │                       │                      │
 │───────────────────────→│                       │                      │
 │                        │  POST /api/valuation/analyze                │
 │                        │  { images: [b64, b64, b64],                │
 │                        │    transcript?: "...",                      │
 │                        │    description?: "..." }                    │
 │                        │──────────────────────→│                      │
 │                        │                       │  ┌─────────────────┐│
 │                        │                       │  │ Image 1 → Gemini ││
 │                        │                       │  │ Image 2 → OCR    ││
 │                        │                       │  │ Image 3 → OCR    ││
 │                        │                       │  │ Voice → Gemini   ││
 │                        │                       │  └─────────────────┘│
 │                        │                       │                      │
 │                        │                       │  Merge & Normalize   │
 │                        │                       │  Store to D1         │
 │                        │  { brand, model,      │                      │
 │                        │    serial, value,     │←─────────────────────│
 │                        │    confidence,        │                      │
 │                        │    breakdown, ... }   │                      │
 │                        │←──────────────────────│                      │
 │  See pre-filled form   │                       │                      │
 │←───────────────────────│                       │                      │
 │                        │                       │                      │
 │  Confirm / Edit        │                       │                      │
 │───────────────────────→│                       │                      │
 │                        │  PUT /api/inventory/:id                     │
 │                        │──────────────────────→│  UPDATE D1           │
 │                        │                       │─────────────────────→│
 │  Item registered       │                       │                      │
 │←───────────────────────│                       │                      │
```

### 4.2 Matchmaking Engine

```
TRIGGER: User clicks "Run Matchmaking"
  ↓
POST /api/matching/run
  ↓
For each active_request × each active_inventory:
  brand_score  = exact(100) | substring(60) | none(0)
  model_score  = exact(100) | substring(50) | none(0)
  price_score  = under_budget(100) | ≤15%_over(85) | ≤30%_over(60) | ≤50%_over(35) | way_over(10)
  condition    = meets(100) | -1_grade(70) | -2_grade(35) | worse(10)
  ↓
  overall = brand×0.30 + model×0.25 + price×0.25 + condition×0.20
  ↓
  IF overall ≥ 20: INSERT match (unless duplicate)
  ↓
Return: { matches_created: N }
```

---

## 5. Database Schema (D1)

6 tables, 10 indexes, CHECK constraints on all status/category fields.

```
inventory         — authenticated assets (13 fields)
client_requests   — buyer wants (12 fields)
matches           — algorithm output (10 fields, FKs to inventory + requests)
dossiers          — appraisal certificates (12 fields, FK to inventory)
profiles          — dealer/enterprise users (8 fields)
activity_log      — audit trail (7 fields, auto-increment PK)
```

Full DDL in `migrations/0001_initial_schema.sql`.

---

## 6. API Reference

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check — returns version |
| POST | `/api/valuation/analyze` | Multi-image AI analysis (Gemini + keyword fallback) |
| POST | `/api/valuation/voice` | Transcript → structured fields |
| GET | `/api/inventory` | List items (filter: ?status=&category=&brand=) |
| GET | `/api/inventory/:id` | Single item |
| POST | `/api/inventory` | Create item |
| PUT | `/api/inventory/:id` | Update item |
| DELETE | `/api/inventory/:id` | Soft-archive |
| GET | `/api/inventory/stats/summary` | Dashboard aggregation |
| GET | `/api/requests` | List requests (filter: ?status=&brand=&urgency=) |
| GET | `/api/requests/:id` | Single request |
| POST | `/api/requests` | Create request |
| PUT | `/api/requests/:id` | Update request |
| DELETE | `/api/requests/:id` | Cancel (soft) |
| GET | `/api/requests/stats/summary` | Request dashboard |
| POST | `/api/matching/run` | Execute matchmaking engine |
| GET | `/api/matching` | List matches (filter: ?request_id=&status=) |
| GET | `/api/matching/:id` | Single match with joins |
| PUT | `/api/matching/:id/accept` | Accept match |
| PUT | `/api/matching/:id/reject` | Reject match |
| GET | `/api/matching/stats/summary` | Match stats |
| GET | `/api/dossiers` | List dossiers with inventory join |
| GET | `/api/dossiers/:id` | Single dossier (increments export_count) |
| POST | `/api/dossiers` | Generate dossier from inventory item |
| PUT | `/api/dossiers/:id` | Update dossier |
| POST | `/api/dossiers/:id/export` | Increment export counter |

---

## 7. Environment & Secrets

| Variable | Where Set | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Pages secret | Google Gemini 3.6 Flash (vision, OCR, voice) |
| `FIREWORKS_API_KEY` | `gsk hosted secret_put` | PaddleOCR VL via Fireworks.ai (planned) |
| `APP_NAME` | `wrangler.jsonc` vars | Display name |
| `APP_VERSION` | `wrangler.jsonc` vars | Version tracking |

---

## 8. Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.0 | 2025 (original) | Express + Firebase + Vercel — sunset due to leaked credentials, random fallback bug |
| 2.0.0 | 2026-08-09 | Full rewrite: Hono + D1 + Cloudflare Pages. 5 API route groups, 6 Hono JSX pages, 6 D1 tables. Keyword fallback replaces random. Zero external auth. |
| 2.1.0 | planned | Multi-modal pipeline (PaddleOCR + multi-image + voice merge), full client-side interactivity |
