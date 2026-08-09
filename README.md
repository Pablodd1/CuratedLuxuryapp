# CuratedLux — Luxury Asset Valuation Platform

**Zero-dependency, self-contained luxury authentication & valuation on Cloudflare Pages.**

---

## Architecture Overview

```
User Phone Camera / Mic
        │
        ▼
┌──────────────────────────────────────┐
│  Hono Framework (Edge Runtime)        │
│  ├─ 6 Page Routes (JSX SSR)           │
│  ├─ 5 API Route Groups (24 endpoints) │
│  └─ Multi-modal AI Pipeline           │
├──────────────────────────────────────┤
│  Gemini 3.5 Flash (Vision)            │  ← Primary AI engine
│  Fireworks PaddleOCR VL 1.6 (OCR)     │  ← Serial/barcode extraction
│  Web Speech API (Voice)               │  ← Voice-to-form normalization
├──────────────────────────────────────┤
│  Cloudflare D1 (SQLite, 7 tables)     │  ← All persistence
│  Cloudflare Pages                     │  ← Hosting
│  gsk-hosted-deploy                    │  ← CI/CD pipeline
└──────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Cloudflare Workers (Edge) | — |
| Framework | Hono | v4.7.5 |
| Language | TypeScript + JSX | TS 5.x |
| Build | Vite + @hono/vite-cloudflare-pages | v6.4.x |
| Database | Cloudflare D1 (SQLite) | — |
| AI Vision | **Gemini 3.5 Flash** | May 2026 |
| AI OCR | Fireworks PaddleOCR VL 1.6 | — |
| AI Voice | Web Speech API (browser) | — |
| Frontend CSS | Tailwind CSS (CDN) | v3.x |
| Frontend HTTP | Axios (CDN) | v1.6.x |
| Icons | Font Awesome 6 (CDN) | v6.4.0 |
| Deployment | gsk-hosted-deploy | — |

## Quick Start (Sandbox)

```bash
# Build
cd /home/user/webapp && npm run build

# Start dev server via PM2
cd /home/user/webapp && pm2 start ecosystem.config.cjs

# Test
curl http://localhost:3000
```

## Quick Start (Local Machine)

```bash
npm install
npm run dev          # Vite dev server
npm run build        # Production build
npm run deploy       # Deploy to Cloudflare Pages
```

## Project Structure

```
webapp/
├── src/
│   ├── index.tsx              # Hono app entry, mounts routes
│   ├── renderer.tsx           # JSX renderer middleware
│   ├── pages/                 # JSX page components (SSR)
│   │   ├── layout.tsx         # Shared layout (5 tabs, minimal)
│   │   ├── home.tsx           # Quick-scanner landing
│   │   ├── valuation.tsx       # Main scanner: camera + mic + manual form
│   │   ├── inventory.tsx      # CRUD inventory management
│   │   ├── requests.tsx       # Client request tracking
│   │   ├── matching.tsx       # Inventory ↔ Request matchmaking
│   │   └── dossier.tsx        # Certificate/dossier generation
│   └── routes/api/
│       ├── valuation.ts       # Multi-modal AI pipeline (analyze + manual)
│       ├── inventory.ts       # Inventory CRUD + stats
│       ├── requests.ts        # Client requests CRUD + stats
│       ├── matching.ts        # Matchmaking engine + accept/reject
│       └── dossiers.ts        # Dossier CRUD + export
├── public/static/
│   ├── app.js                 # Client-side JS (~500 lines)
│   └── style.css              # Shared styles
├── migrations/                # D1 schema migrations
├── wrangler.jsonc            # Cloudflare Pages config
├── vite.config.ts            # Vite build config
├── tsconfig.json             # TypeScript config
├── ecosystem.config.cjs      # PM2 config for sandbox
├── ARCHITECTURE.md           # System spec & production checklist
└── DEVELOPER_GUIDE.md        # Onboarding & debugging guide
```

## API Endpoints (24 Total)

### Valuation
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/valuation/analyze` | Multi-modal pipeline: Gemini Vision + PaddleOCR + Voice → D1 store |
| POST | `/api/valuation/voice` | Dedicated voice-only parser |
| POST | `/api/valuation/manual` | Submit category-aware manual form → Gemini valuation → D1 store |

### Inventory
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/inventory` | List items (filters: category, brand, status) |
| POST | `/api/inventory` | Create item |
| GET | `/api/inventory/stats` | Aggregate stats (total, value, by category) |
| GET | `/api/inventory/:id` | Get single item |
| DELETE | `/api/inventory/:id` | Delete item |

### Requests
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/requests` | List client requests (filters: brand, urgency, status) |
| POST | `/api/requests` | Create request |
| GET | `/api/requests/stats` | Aggregate stats |
| DELETE | `/api/requests/:id` | Delete request |

### Matching
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/matching/run` | Run matchmaking engine |
| GET | `/api/matching/stats` | Match stats |
| POST | `/api/matching/:id/accepted` | Accept match |
| POST | `/api/matching/:id/rejected` | Reject match |

### Dossiers
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dossiers` | List dossiers |
| POST | `/api/dossiers` | Generate dossier from inventory item |
| GET | `/api/dossiers/:id` | View dossier |
| POST | `/api/dossiers/:id/export` | Export dossier (increments counter) |

### System
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check with DB connectivity timestamp |

## Database Schema (D1)

7 tables, 11 indexes:

```
valuation_items       — Core asset records (brand, model, value, confidence, AI reasoning)
client_requests       — Client sourcing requests (brand, budget, urgency, condition)
match_results         — Matchmaking results (score, dimensions, status)
dossiers              — Authentication certificates (QR tokens, export counters)
asset_images          — Base64 image storage (indexed by valuation_item_id)
ocr_extractions       — OCR results (serials, barcodes, raw text)
user_profiles         — App user settings
```

## Multi-Modal AI Pipeline

```
                    ┌──────────────┐
Image 0 ──────────►│ Gemini 3.5    │──► brand, model, year, condition,
                    │ Flash Vision  │    value, authenticity, confidence_breakdown
                    └──────────────┘
                    ┌──────────────┐
Images 1+ ─────────►│ PaddleOCR    │──► serial numbers, barcodes,
                    │ VL 1.6       │    reference numbers, certificate text
                    └──────────────┘
                    ┌──────────────┐
Voice ─────────────►│ Web Speech   │──► model, year, condition hints,
                    │ API          │    purchase details, provenance
                    └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │ normalizeResults() │──► merge + de-duplicate + conflict resolve
                    └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │ quality gate │──► confidence ≥ 70 → D1 store
                    │ (confidence) │    confidence < 70 → return only
                    └──────────────┘
```

### VISION_PROMPT Extraction (Gemini 3.5 Flash)

15 JSON fields extracted from a single image:

| Field | Type | Description |
|-------|------|-------------|
| `category` | string | Watches, Handbags, Fine Jewelry, Luxury Vehicles, Art & Collectibles |
| `brand` | string | Brand name detected from logo/design |
| `model` | string | Model name/number |
| `referenceNumber` | string | Reference number if visible |
| `year` | number | Estimated production year |
| `condition_grade` | number | 0-4 scale (0=poor, 4=mint) |
| `condition_label` | string | Text label (Mint, Excellent, Good, Fair, Poor) |
| `estimatedValue` | number | USD estimate |
| `currency` | string | Default USD |
| `confidence` | number | Overall confidence 0-100 |
| `authenticityStatus` | string | AUTHENTIC MATCH / REQUIRES IN-PERSON / COUNTERFEIT INDICATORS |
| `reasoning` | string | AI reasoning chain |
| `confidence_breakdown` | object | 6 sub-scores: logo, serial, materials, bezel_geometry, dial_texture, overall_proportion |
| `inclusions` | string[] | Detected accessories (box, papers, certificate) |
| `red_flags` | string[] | Authenticity concerns |

### OCR_PROMPT Extraction (PaddleOCR VL 1.6)

Serial numbers, barcodes, reference numbers, certificate text. Cost: $0.0002/image via Fireworks.ai.

### VOICE_PROMPT Extraction (Web Speech API)

Natural language description → structured extraction: model hints, year estimates, condition words, purchase details, provenance notes.

## Secrets

Required Cloudflare secrets (set via production environment):

| Secret | Purpose |
|--------|---------|
| `GEMINI_API_KEY` | Google AI API key for Gemini 3.5 Flash vision |
| `FIREWORKS_API_KEY` | Fireworks.ai API key for PaddleOCR VL 1.6 |

Set via:
```bash
# Production (gsk hosted)
gsk hosted secret_put --name GEMINI_API_KEY --value "$KEY"
gsk hosted secret_put --name FIREWORKS_API_KEY --value "$KEY"

# Local dev (never committed)
echo "GEMINI_API_KEY=..." > .dev.vars
echo "FIREWORKS_API_KEY=..." >> .dev.vars
```

## Category Variable Matrices

### Watches
`case_material`, `case_size_mm`, `movement`, `bracelet_type`, `year`, `condition_grade`, `purchase_price`, `insurance_value`, `box_papers`, `notes`

### Handbags
`leather_type`, `hardware`, `bag_size`, `color`, `year`, `condition_grade`, `purchase_price`, `insurance_value`, `box_papers`, `notes`

### Fine Jewelry
`metal_purity`, `gemstone`, `gemstone_carat`, `year`, `condition_grade`, `purchase_price`, `insurance_value`, `box_papers`, `notes`

### Luxury Vehicles
`vin`, `mileage_km`, `year`, `condition_grade`, `purchase_price`, `insurance_value`, `notes`

### Art & Collectibles
`artist`, `medium`, `dimensions`, `year`, `condition_grade`, `purchase_price`, `insurance_value`, `notes`

## Page Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | home.tsx | Quick-scanner landing page |
| `/valuation` | valuation.tsx | Main scanner: camera + mic + manual form + dropzone + results panel |
| `/inventory` | inventory.tsx | Inventory CRUD with filters, stats, detail modal |
| `/requests` | requests.tsx | Client request tracking with filters, stats |
| `/matching` | matching.tsx | Inventory ↔ Request matchmaking engine |
| `/dossier` | dossier.tsx | Certificate generation, viewing, export |
| `/dossier/:id` | dossier.tsx | Single dossier certificate view |

## Model Intelligence (August 2026)

### Current: Gemini 3.5 Flash (Upgraded from 2.0 Flash)

| Metric | Gemini 2.0 Flash (old) | Gemini 3.5 Flash (current) | Improvement |
|--------|----------------------|---------------------------|-------------|
| MMMU-Pro | ~70% (est.) | 83.6% | +20% relative |
| Speed | Baseline | 4x faster | — |
| Price | $0.10/1M input | $0.30/1M input | — |
| Context | 128K | 1M tokens | 8x larger |
| Fine-tuneable | No | Yes (Vertex AI SFT) | New capability |
| Released | 2024 | May 2026 | — |

### Fine-Tuning Roadmap

| Phase | Model | Method | When |
|-------|-------|--------|------|
| Phase 1 | Gemini 3.5 Flash | Vertex AI supervised fine-tuning | Q3 2026 |
| Phase 2 | Llama 4 Scout 17B | LoRA on Cloudflare Workers AI (free inference) | Q3-Q4 2026 |
| Phase 3 | Qwen3-VL 30B/235B | Full fine-tune (Asian brands, 32-language OCR) | Q4 2026 |

### Competitor Landscape

| Product | Coverage | Method | Accuracy | Hardware |
|---------|----------|--------|----------|----------|
| Entrupy | Bags, sneakers, jewelry | Proprietary AI + microscope | 99.86% | $300+ device |
| LegitApp | Bags, sneakers, watches | AI + 2 human experts | Unknown | Phone camera |
| WatchSpace | Watches only | AI (23K models) | Unknown | Phone camera |
| Chrono24 Scanner | Watches only | AI (15K models) | Unknown | Phone camera |
| WatchPatrol | Watches only | AI vs marketplace | Unknown | Photo upload |
| **CuratedLux** | **Watches + Bags + Jewelry + Art + Vehicles** | **Gemini 3.5 + OCR + Voice** | **83.6% MMMU-Pro** | **Phone camera** |

**Key differentiators**: Multi-category (no competitor does all 5), voice input (unique), multi-modal fusion (Vision + OCR + Voice), automated dossier generation, matchmaking engine, zero hardware requirement.

### Open Datasets Available

| Dataset | Size | Content | License |
|---------|------|---------|---------|
| Chrono24 Webscraped (GitHub) | 280K listings | Watches: brand, model, ref, price, images | Open |
| Kaggle Luxury Watches | ~1K | Watch specs + prices | Open |
| Roboflow Jewelry | 755 images | Jewelry classification | Open |
| HuggingFace Jewelry | 6,100 images | 4 jewelry categories | Open |
| Dataseeds Jewelry | 340K images | Global jewelry with EXIF | Commercial |
| Fashion Image Retrieval (arXiv) | Multi-source | E-commerce + fashion | Research |
| WatchCharts API | Market data | Real-time pricing | $200/5K credits |

## Development Commands

```bash
# Build & Serve
npm run build                     # Vite production build
npm run dev                       # Vite dev server (local machine)
npm run dev:sandbox               # Wrangler Pages dev (sandbox)
npm run dev:d1                    # Wrangler Pages dev with local D1

# Database
npm run db:migrate:local          # Apply migrations to local D1
npm run db:migrate:prod           # Apply migrations to production D1
npm run db:seed                   # Seed test data
npm run db:reset                  # Reset local DB + migrate + seed
npm run db:console:local          # Interactive D1 shell (local)
npm run db:console:prod           # Interactive D1 shell (production)

# Deploy
npm run deploy                    # Build + deploy to Cloudflare Pages

# Git
npm run git:commit -- "message"   # Stage + commit
npm run git:status                # Show status
npm run git:log                   # Show log

# Utilities
npm run clean-port                # Kill process on port 3000
```

## Production

- **URL**: `https://dfef8955-5fb8-4f35-beda-9575f7dc89b8.vip.gensparksite.com`
- **Platform**: Cloudflare Pages (gsk-hosted-deploy)
- **Database**: D1 production (`dfef8955-5fb8-4f35-beda-9575f7dc89b8-db`)
- **Secrets**: GEMINI_API_KEY, FIREWORKS_API_KEY (set via gsk hosted secret_put)

## Known Issues & TODO

- [ ] GEMINI_API_KEY and FIREWORKS_API_KEY secrets not yet set in production
- [ ] Route mismatch: app.js calls `/api/valuation/scan` — should be `/api/valuation/analyze`
- [ ] Camera/mic button wiring incomplete (new IDs in valuation.tsx not yet in app.js)
- [ ] Manual form endpoint (`POST /api/valuation/manual`) not yet created
- [ ] Fine-tuning pipeline Phase 1 (Gemini 3.5 Flash SFT on Vertex AI)
- [ ] Vector similarity search for model matching (CF Vectorize or cosine-sim)
- [ ] Human-in-the-loop review queue for confidence < 70%
- [ ] Live market pricing via WatchCharts API integration
- [ ] Guided multi-angle photo sequence (caseback, clasp, crown, movement)

## Documentation Index

| File | Content |
|------|---------|
| `README.md` | This file — overview, API, schema, AI pipeline, competitor analysis |
| `ARCHITECTURE.md` | System specification, accuracy targets, scaling strategy, production checklist |
| `DEVELOPER_GUIDE.md` | Onboarding, codebase tour, debugging guide, testing checklist |

---

*Last updated: August 9, 2026 — Model upgrade to Gemini 3.5 Flash*
