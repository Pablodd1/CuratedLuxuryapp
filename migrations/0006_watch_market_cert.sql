-- CuratedLux v2.1 — Watch market pricing + certificate signing
-- 1) Baseline table: median/avg live prices per reference from the 280K Chrono24
--    listing dataset (open license, ~Sep 2023 snapshot — prices drift, this is
--    the honest "last known market" baseline until a live feed is wired).
-- 2) inventory gains market_price + price_source + price_as_of so the review
--    form and dossier show WHICH price the user confirmed.
-- 3) dossiers gains cert_signature (Ed25519 over the canonical certificate
--    payload) — makes /verify/:id tamper-evident instead of a demo hash.

CREATE TABLE IF NOT EXISTS market_price_baseline (
  brand TEXT NOT NULL,
  reference_number TEXT NOT NULL,
  model TEXT DEFAULT '',
  median_price REAL DEFAULT 0,
  avg_price REAL DEFAULT 0,
  min_price REAL DEFAULT 0,
  max_price REAL DEFAULT 0,
  listing_count INTEGER DEFAULT 0,
  as_of TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (brand, reference_number)
);

CREATE INDEX IF NOT EXISTS idx_baseline_ref ON market_price_baseline(reference_number);

ALTER TABLE inventory ADD COLUMN dial TEXT DEFAULT '';
ALTER TABLE inventory ADD COLUMN market_price REAL DEFAULT 0;
ALTER TABLE inventory ADD COLUMN price_source TEXT DEFAULT '';
ALTER TABLE inventory ADD COLUMN price_as_of TEXT DEFAULT '';

ALTER TABLE scan_history ADD COLUMN dial TEXT DEFAULT '';
ALTER TABLE scan_history ADD COLUMN market_price REAL DEFAULT 0;
ALTER TABLE scan_history ADD COLUMN price_source TEXT DEFAULT '';

ALTER TABLE dossiers ADD COLUMN cert_signature TEXT DEFAULT '';
ALTER TABLE dossiers ADD COLUMN cert_public_key TEXT DEFAULT '';

-- code (auth.ts createSession) writes embed_origin; absent from 0001-0005
ALTER TABLE sessions ADD COLUMN embed_origin TEXT DEFAULT NULL;

-- Key/value store for the certificate signing keypair (JWK). Without this,
-- every Workers cold start regenerates a key and old signatures die.
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
