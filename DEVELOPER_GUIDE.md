# 🛠️ CuratedLuxury - Developer & CTO Handoff Guide

Welcome to **CuratedLuxury** — an AI-powered luxury asset valuation, authentication, and inventory management edge web platform built with **Hono JSX**, **Cloudflare Workers / Pages**, **Google Gemini 3.5 Vision AI**, and **Cloudflare D1 SQLite**.

---

## 📐 System Architecture Overview

```
                          ┌────────────────────────────────┐
                          │   Client Browser / Mobile App   │
                          └───────────────┬────────────────┘
                                          │ HTTP / WebSocket
                                          ▼
                ┌──────────────────────────────────────────────────┐
                │      Cloudflare Pages Edge SSR (Hono App)        │
                ├──────────────────────────────────────────────────┤
                │  - /api/valuation (Multi-modal Gemini 3.5 AI)    │
                │  - /api/autocomplete (Tier 4 Reference Search)   │
                │  - /api/inventory (D1 SQLite Inventory Store)    │
                │  - /dossier/:id (Print-Ready Certificate View)   │
                └───────┬──────────────────────────┬───────────────┘
                        │                          │
                        ▼                          ▼
      ┌──────────────────────────────────┐   ┌───────────────────────────┐
      │   Cloudflare D1 SQLite Database    │   │  Google Gemini 3.5 Vision │
      │   (curatedlux-db / binding DB)     │   │  & Fireworks PaddleOCR    │
      └──────────────────────────────────┘   └───────────────────────────┘
```

---

## 🌟 Key Features Implemented

1. **Multi-Angle Camera Capture with Real-Time HUD Overlay**:
   * On-screen floating HUD banner (`#cl-live-hud-banner`) with distance advice (`25-35 cm` straight-on, `10-15 cm` macro close-up).
   * Shot progression counter for Watches (4 shots), Handbags (5 shots), Fine Jewelry (4 shots), Vehicles (4 shots), and Art (4 shots).
   * Canvas Laplacian edge variance blur rejection filter (`sharpness >= 8`).

2. **One-Click Autocomplete & Reference Data Store**:
   * Endpoints: `GET /api/autocomplete/search?q=...` & `GET /api/autocomplete/details?ref=...`.
   * High-precision dataset stored in `src/lib/watchCatalog.ts` and exported in `data/luxury_catalog_master.json`.
   * Auto-fills Brand, Model, Reference, Category, Case Material, Case Size, Movement, Bracelet, and Baseline Price.

3. **Step 3: Verification & Confirmation Review Card**:
   * Pre-filled editable fields allowing user/client to adjust AI outputs.
   * `Back / Retake` navigation to redo photo capture without losing state.
   * `Confirm & Save` action to persist in Cloudflare D1 inventory and launch print-ready dossier (`/dossier/:id`).

---

## 🎯 Recommended Next-Phase Upgrades for Developers

Here are the top 4 strategic upgrades recommended for the next engineering team:

### 1. 🔍 Cloudflare Vectorize RAG Integration
* **Objective**: Connect `data/luxury_catalog_master.json` to Cloudflare Vectorize embeddings.
* **How**: Generate 768-dim embeddings for all reference items and compare user image feature vectors for sub-10ms similarity scoring.

### 2. ⚡ Web Worker Canvas Blur & Edge Analysis
* **Objective**: Move Laplacian edge variance computation (`measureSharpness`) from the main UI thread to a dedicated Web Worker (`public/static/sharpness-worker.js`) to guarantee 60 FPS video framing.

### 3. 📄 Automated Server-Side PDF & QR Code Verification
* **Objective**: Generate downloadable PDF certificates for `/dossier/:id` with embedded HMAC SHA-256 signatures and QR codes linked to the live verification endpoint.

### 4. 📈 Live Secondary Market Price Feed Ticker
* **Objective**: Integrate webhooks or cron scheduled tasks to poll WatchCharts / Sotheby's / Chrono24 pricing updates into D1 every 24 hours.

---

## 💻 Developer Command Cheat Sheet

```bash
# 1. Install Dependencies
npm install

# 2. Start Local Development Server
npm run dev

# 3. Build Production Edge Bundle
npm run build

# 4. Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name=curatedlux

# 5. Remote Database Migrations & Seeding
npx wrangler d1 execute curatedlux-db --file=seed.sql
```

---

## 📁 Repository & Live URLs
* **GitHub Repository**: [`Pablodd1/CuratedLuxuryapp`](https://github.com/Pablodd1/CuratedLuxuryapp) (Branch: `main`)
* **Live App URL**: [https://curatedlux.pages.dev](https://curatedlux.pages.dev)
