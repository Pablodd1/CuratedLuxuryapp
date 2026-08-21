import sqlite3, glob, json, os, time, urllib.request, urllib.error, sys, re

BASE = 'http://127.0.0.1:3000'
dbf = glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite'))[0]
# Build a valid HS256 JWT with the local AUTH_SECRET from .dev.vars (same
# scheme as src/lib/auth.ts signJwt). Test-only; production uses real login.
def _b64url(data):
    import base64
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()

def _make_token():
    import base64, hmac, hashlib
    secret_line = [l for l in open('.dev.vars') if l.startswith('AUTH_SECRET=')]
    secret = (secret_line[0].strip().split('=', 1)[1].encode() if secret_line else b'local-dev-secret-1234567890')
    header = _b64url(json.dumps({'alg': 'HS256', 'typ': 'JWT'}).encode())
    now = int(time.time())
    body = _b64url(json.dumps({'sub': 'testuser', 'email': 'test@curatedlux.local', 'role': 'owner', 'iat': now, 'exp': now + 3600, 'jti': 'testjti'}).encode())
    sig = _b64url(hmac.new(secret, f'{header}.{body}'.encode(), hashlib.sha256).digest())
    return f'{header}.{body}.{sig}'

# Ensure the test user + inventory row exist (idempotent)
def _seed():
    con = sqlite3.connect(dbf)
    con.execute("ALTER TABLE sessions ADD COLUMN embed_origin TEXT") if not any(r[1] == 'embed_origin' for r in con.execute('PRAGMA table_info(sessions)')) else None
    con.execute("INSERT OR REPLACE INTO users (id, email, password_hash, password_salt, display_name, role, created_at) VALUES ('testuser', 'test@curatedlux.local', 'x', 'x', 'Test', 'owner', '2026-08-21 00:00:00')")
    con.execute("INSERT OR REPLACE INTO inventory (id, owner_id, category, brand, model, reference_number, dial, year, condition_grade, condition_label, estimated_value, market_price, price_source, price_as_of, currency, confidence, authenticity_status, inclusions, image_count, status) VALUES ('invtest1', 'testuser', 'Watches', 'Rolex', 'Submariner Date', '126610LN', 'Black', 2024, 4, 'Excellent', 15200, 15762, 'chrono24_baseline_2023-09', '2023-09', 'USD', 96, 'AUTHENTIC MATCH', '[]', 3, 'active')")
    con.commit()
    con.close()

_seed()
TOKEN = _make_token()

def req(method, path, body=None, auth=True, want_json=True):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE + path, data=data, method=method)
    r.add_header('Content-Type', 'application/json')
    if auth:
        r.add_header('Authorization', 'Bearer ' + TOKEN)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            raw = resp.read().decode()
            return resp.status, (json.loads(raw) if want_json and raw else raw)
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw

ok = fail = 0
def check(name, cond, extra=''):
    global ok, fail
    if cond:
        ok += 1
        print(f'PASS  {name}')
    else:
        fail += 1
        print(f'FAIL  {name}  {extra[:220]}')

for _ in range(30):
    try:
        s, _ = req('GET', '/api/health', auth=False)
        if s == 200:
            break
    except Exception:
        time.sleep(1)

# Run: python3 test_market_cert.py  (needs `npx wrangler pages dev dist --d1=curatedlux-db --local` up)
# 1. create dossier via the SPA's field name (inventory_item_id)
s, d = req('POST', '/api/dossiers', {'inventory_item_id': 'invtest1', 'notes': 'local test'})
check('POST /api/dossiers (SPA field name) → 201', s == 201 and d.get('id'), f'status={s} {d}')
did = d.get('id', '')
check('dossier has cert_signature (ES256)', bool(d.get('cert_signature')), str(d)[:200])
check('dossier has cert_public_key (JWK P-256)', '"crv":"P-256"' in (d.get('cert_public_key') or ''), str(d.get('cert_public_key'))[:120])

# 2. authenticated read → signature re-verified against live row
s, d = req('GET', f'/api/dossiers/{did}')
check('GET dossier: cert_status=valid', s == 200 and d.get('cert_status') == 'valid', str(d.get('cert_status')))

# 3. public verify page → HTML, not JSON
s, html = req('GET', f'/verify/{did}', auth=False, want_json=False)
check('GET /verify/:id → 200 HTML', s == 200 and '<html' in (html or '').lower(), f'status={s}')
check('/verify page shows verified', 'VERIFIED' in (html or '').upper() or 'valid' in (html or '').lower(), (html or '')[:150])

# 4. tamper inventory row → signature must fail
con = sqlite3.connect(dbf)
con.execute("UPDATE inventory SET reference_number = '126613LN' WHERE id = 'invtest1'")
con.commit()
s, d = req('GET', f'/api/dossiers/{did}')
check('tampered row: cert_status=mismatch', d.get('cert_status') == 'mismatch', str(d.get('cert_status')))
s, html = req('GET', f'/verify/{did}', auth=False, want_json=False)
check('tampered row: /verify shows not valid', 'UNVERIFIED OR INVALID' in (html or ''), (html or '')[:150])

# 5. restore → valid again
con.execute("UPDATE inventory SET reference_number = '126610LN' WHERE id = 'invtest1'")
con.commit()
s, d = req('GET', f'/api/dossiers/{did}')
check('restored row: cert_status=valid', d.get('cert_status') == 'valid', str(d.get('cert_status')))

# 6. legacy dossier without signature → legacy status, not 'valid'
con.execute("INSERT OR IGNORE INTO dossiers (id, inventory_id, created_at) VALUES ('dos-legacy', 'invtest1', '2026-08-21 00:00:00')")
con.commit()
s, d = req('GET', '/api/dossiers/dos-legacy')
check('legacy dossier: cert_status=legacy', d.get('cert_status') == 'legacy', str(d.get('cert_status')))

# 7. market endpoint regression
s, d = req('GET', '/api/market-prices?reference=Rolex%20Submariner%20126610LN%20black%20dial&brand=Rolex', auth=False)
check('market: free-text → 15762 exact baseline', d.get('price') == 15762 and d.get('source') == 'chrono24_baseline_2023-09', str(d)[:160])
s, d = req('GET', '/api/market-prices?reference=16202&brand=AP', auth=False)
check('market: prefix 16202 (Millenary)', d.get('price') is not None and 'prefix' in d.get('source', ''), str(d)[:160])
s, d = req('GET', '/api/market-prices?reference=5811&brand=Patek', auth=False)
check('market: bare 5811 → Nautilus (100% one brand, legit)', d.get('price') is not None and 'prefix' in d.get('source', ''), str(d)[:160])
s, d = req('GET', '/api/market-prices?reference=90&brand=Tudor', auth=False)
check('market: brand-mixed prefix 90 rejected (guard)', d.get('price') is None, str(d)[:160])
s, d = req('GET', '/api/market-prices?reference=ZZ9999&brand=Rolex', auth=False)
check('market: unknown ref → null', d.get('price') is None, str(d)[:160])

print(f'\n{ok} passed, {fail} failed')
sys.exit(1 if fail else 0)
