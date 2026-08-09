# CuratedLux Developer Guide

## Quick Start (5 minutes to running locally)

```bash
# Clone the repo (from SB-Git or GitHub)
git clone <repo-url> curatedlux && cd curatedlux

# Install dependencies
npm install

# Build the project
npm run build

# Seed the local D1 database
npx wrangler pages dev dist --d1=DB --ip 0.0.0.0 --port 3000 &
sleep 3
# In another terminal, seed the SQLite:
python3 -c "
import sqlite3, glob
db = glob.glob('.wrangler/state/v3/d1/**/*.sqlite', recursive=True)[0]
conn = sqlite3.connect(db)
conn.executescript(open('migrations/0001_initial_schema.sql').read())
conn.executescript(open('seed.sql').read().replace(\"datetime('now')\", 'CURRENT_TIMESTAMP'))
conn.commit()
print('Seeded:', [r[0] for r in conn.execute('SELECT name FROM sqlite_master WHERE type=\"table\" AND name NOT LIKE \"sqlite_%\"').fetchall()])
conn.close()
"

# Test
curl http://localhost:3000/api/health
# → {"status":"ok","version":"2.0.0"}
curl http://localhost:3000/api/inventory
# → {"items":[...], "total":7, ...}
```

## Codebase Tour

```
curatedlux/
│
├── ARCHITECTURE.md          ← THIS FILE — accuracy targets, production checklist, scaling
├── DEVELOPER_GUIDE.md       ← You are here
│
├── package.json             ← Hono 4.x + Vite + Wrangler stack
├── tsconfig.json            ← Strict mode, Hono JSX (jsxImportSource: "hono/jsx")
├── vite.config.ts           ← @hono/vite-cloudflare-pages plugin
├── wrangler.jsonc           ← Cloudflare Pages config + D1 binding + vars
├── ecosystem.config.cjs     ← PM2 config for sandbox dev server
│
├── migrations/
│   └── 0001_initial_schema.sql  ← 6 tables, 10 indexes, CHECK constraints
│
├── seed.sql                 ← 7 inventory items, 3 client requests, 1 profile
│
├── src/
│   ├── index.tsx            ← MAIN ENTRY POINT — Hono app, route mounting, middleware
│   │
│   ├── db/
│   │   └── schema.ts        ← TypeScript interfaces for all 6 entities
│   │
│   ├── routes/api/
│   │   ├── valuation.ts     ← /api/valuation/analyze + /voice — Gemini + keyword fallback
│   │   ├── inventory.ts     ← /api/inventory — full CRUD + stats summary
│   │   ├── requests.ts      ← /api/requests — CRUD + stats
│   │   ├── matching.ts      ← /api/matching/run + CRUD + accept/reject
│   │   └── dossiers.ts      ← /api/dossiers — generate + export certificates
│   │
│   └── pages/
│       ├── layout.tsx       ← SHARED LAYOUT — nav, footer, Tailwind config, Font Awesome
│       ├── home.tsx         ← Landing page with hero, stats, module cards
│       ├── valuation.tsx    ← AI scanner: upload zone, camera, text input, results panel
│       ├── inventory.tsx    ← Inventory table + add/edit modal + filters
│       ├── requests.tsx     ← Client requests table + new request form
│       ├── matching.tsx     ← Match results + run button
│       └── dossier.tsx      ← Certificate view + generate modal
│
└── public/static/
    ├── style.css            ← Custom CSS: hero gradient, animations, badges, toast
    ├── app.js               ← Client-side JS: API helpers, page routing
    └── favicon.svg          ← Diamond/gem icon
```

## Key Architecture Decisions

### 1. Why Hono instead of Express?
- **Edge-native.** Runs on Cloudflare Workers without Node.js polyfills.
- **JSX built-in.** No React needed. Server-side renders HTML directly.
- **Tiny.** ~13 KB gzipped vs Express at ~50 KB.
- **Type-safe.** First-class TypeScript support, typed bindings for D1 env.

### 2. Why D1 instead of Firebase/Firestore?
- **Zero external auth.** No Firebase SDK, no Google Cloud project.
- **SQL.** Developers know SQL. Firestore's query model is limited.
- **Globally distributed.** D1 reads from the nearest edge location.
- **Cost.** Free tier: 5 GB storage, 5M reads/month. No per-document read billing.
- **The original Firebase credentials were leaked in the uploaded code.** This rewrite eliminates that risk entirely.

### 3. Why Gemini 2.0 Flash?
- **Native JSON mode.** `responseMimeType: 'application/json'` → no parsing fragile text.
- **Multimodal.** Accepts image + text in one call.
- **Cheap.** $0.10 per 1,000 images.
- **Fast.** ~800ms median response time.

### 4. Why keyword fallback (not random)?
- **The original code had `Math.floor(Math.random() * LUXURY_DATASET.length)`** — this returned fake Ferrari results for Casio uploads. **This is the #1 critical bug we fixed.**
- Keyword fallback matches brand/model from text input against 11-item dataset.
- Returns `INSUFFICIENT_DATA` with confidence=0 when nothing matches.
- No random, no hallucination, no fake data.

## How to Add a New Feature

### Adding an API Endpoint
1. Create `src/routes/api/new_feature.ts` using the Hono pattern:
```typescript
import { Hono } from 'hono'
const app = new Hono()
app.get('/endpoint', async (c) => {
  const db = c.env.DB
  const { results } = await db.prepare('SELECT ...').all()
  return c.json(results)
})
export default app
```
2. Mount it in `src/index.tsx`:
```typescript
import newFeatureRoutes from './routes/api/new_feature'
app.route('/api/new-feature', newFeatureRoutes)
```

### Adding a Page
1. Create `src/pages/new_page.tsx`:
```typescript
import { Layout } from './layout'
export function NewPage() {
  return (
    <Layout title="New Page — CuratedLux" active="new">
      <div>Your content here</div>
    </Layout>
  )
}
```
2. Register it in `src/index.tsx`:
```typescript
import { NewPage } from './pages/new_page'
app.get('/new-page', (c) => c.html(<NewPage />))
```
3. Add the nav link in `src/pages/layout.tsx`.

### Adding a Database Migration
1. Create `migrations/0002_descriptive_name.sql`
2. Use `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN`
3. Always make migrations idempotent
4. Test locally: `npx wrangler d1 execute DB --local --file=./migrations/0002_xxx.sql`
5. Deploy. Migrations auto-apply on `gsk hosted deploy`.

## Debugging Guide

### "D1_ERROR: no such table" locally
The local SQLite wasn't seeded. Run the seed script from Quick Start above.

### "D1_ERROR: no such table" in production
The migration didn't apply. Check: `gsk hosted d1_schema`. If tables missing:
`gsk hosted d1_execute --sql "CREATE TABLE IF NOT EXISTS ..."`

### Build fails with "Expected '}' but found ':'"
ESBuild is interpreting `{}` inside `<script>` tags as JSX. Wrap with `{html\`...\`}`:
```tsx
<script>{html`
  const obj = { key: 'value' };
`}</script>
```

### Gemini returns gibberish
- Check API key is set: `gsk hosted secret_list` → should show `GEMINI_API_KEY`
- Check quota: `https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com`
- Fallback to keyword mode automatically — verify with: `curl -X POST /api/valuation/analyze -d '{"description":"rolex submariner"}'`

### Deploy fails with "pending_approval" timeout
The user has 10 minutes to approve the deploy in the UI. After 3 wait attempts (~13 min), the action expires. Submit a new deploy.

### Worker 404s after deploy
Check: `gsk hosted worker_get`. If "Worker not found", the bundle may be too large. Ensure `dist/` is under 10 MB compressed.

## Common Modifications

### Changing the AI model
Edit the Gemini prompt in `src/routes/api/valuation.ts` — the prompt string controls what fields Gemini returns. Also update the `extractJSON` response parsing if you change the output schema.

### Adding a new luxury brand to fallback
Edit the `LUXURY_DATASET` array in `src/routes/api/valuation.ts`. Add a new object with:
```typescript
{ keywords: ['keyword1', 'keyword2', ...], brand: '...', model: '...', category: '...', ... }
```

### Changing matching weights
Edit the four weights in `src/routes/api/matching.ts` (line ~145):
```typescript
brand * 0.30 + model * 0.25 + price * 0.25 + condition * 0.20
```
All four must sum to 1.0.

### Adding a new environment variable
1. Add to `wrangler.jsonc` under `vars`
2. Add to the `Bindings` type in `src/index.tsx`
3. For secrets, use `gsk hosted secret_put --name VAR_NAME --value "$VALUE"`
4. For local dev, add to `.dev.vars` (never committed)

## Testing Checklist

Before every production deploy, verify:

```bash
# 1. Health check
curl https://<worker-url>/api/health
# Must return {"status":"ok"}

# 2. All pages render (200)
for p in / /valuation /inventory /requests /matching /dossier; do
  curl -so /dev/null -w "%{http_code}" https://<worker-url>$p
done
# Must all be 200

# 3. API endpoints return data
curl https://<worker-url>/api/inventory
curl https://<worker-url>/api/requests
curl https://<worker-url>/api/matching
# Must return valid JSON with items array

# 4. Valuation fallback works (no API key needed)
curl -X POST https://<worker-url>/api/valuation/analyze \
  -H 'Content-Type: application/json' \
  -d '{"description":"rolex submariner"}'
# Must return valid valuation JSON

# 5. Static assets load
curl -sI https://<worker-url>/static/style.css | grep "200 OK"
curl -sI https://<worker-url>/static/app.js | grep "200 OK"

# 6. CORS headers present
curl -sI -H "Origin: https://example.com" https://<worker-url>/api/health | grep "Access-Control"
```

## Production Deployment

```bash
# 1. Build
npm run build

# 2. Commit
git add . && git commit -m "describe changes"

# 3. Deploy (requires user approval in UI)
gsk hosted deploy

# 4. Wait for approval
gsk hosted action_wait --id <pending_action_id>

# 5. Set secrets (first deploy only, or when rotating keys)
gsk hosted secret_put --name GEMINI_API_KEY --value "$GEMINI_API_KEY"
```

## Contact & Ownership

This project is a full rewrite of the original CuratedLux (carateluxurywf).
The original Express/Firebase stack has been fully sunset.
All original Firebase credentials have been rotated and are no longer valid.

Maintained as a Genspark-hosted Cloudflare Pages project.
All deployments go through `gsk hosted deploy`.
