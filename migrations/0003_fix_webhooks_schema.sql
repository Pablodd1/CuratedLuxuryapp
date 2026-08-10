-- CuratedLux 0003 — Fix webhooks, webhook_deliveries, scan_history to match application code
-- Drops and recreates tables (no production data yet — webhooks were erroring on deploy)

-- Drop old webhook tables
DROP TABLE IF EXISTS webhook_deliveries;
DROP TABLE IF EXISTS webhooks;

-- Recreate webhooks to match code (name, target_url, signing_secret, event_types, is_active, retry_max, retry_backoff, timeout_ms)
CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT DEFAULT 'Untitled Webhook',
  target_url TEXT NOT NULL,
  signing_secret TEXT NOT NULL,
  event_types TEXT DEFAULT 'scan.created',
  is_active INTEGER DEFAULT 1,
  retry_max INTEGER DEFAULT 3,
  retry_backoff TEXT DEFAULT 'exponential',
  timeout_ms INTEGER DEFAULT 10000,
  description TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Recreate webhook_deliveries to match code (event_id, event_type, signature, attempts, last_status, last_response)
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY,
  webhook_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  signature TEXT DEFAULT '',
  attempts INTEGER DEFAULT 0,
  last_status INTEGER,
  last_response TEXT DEFAULT '',
  next_retry_at DATETIME,
  delivered_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (webhook_id) REFERENCES webhooks(id)
);

-- Fix scan_history to have full columns expected by valuation.ts storeValuation()
-- Adds: source, inclusions, red_flags, image_count, scan_payload, scan_source_host, inventory_id
-- Existing columns (id, user_id, category, brand, model, reference_number, year, condition_grade, 
-- condition_label, estimated_value, currency, confidence, authenticity_status, reasoning, created_at) 
-- are already present. Missing: extras, image_urls (will be dropped).

DROP TABLE IF EXISTS scan_history;

CREATE TABLE IF NOT EXISTS scan_history (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  source TEXT DEFAULT 'manual',
  category TEXT,
  brand TEXT,
  model TEXT,
  reference_number TEXT,
  year INTEGER,
  condition_grade INTEGER,
  condition_label TEXT,
  estimated_value REAL,
  currency TEXT DEFAULT 'USD',
  confidence INTEGER,
  authenticity_status TEXT,
  reasoning TEXT DEFAULT '',
  inclusions TEXT DEFAULT '[]',
  red_flags TEXT DEFAULT '[]',
  image_count INTEGER DEFAULT 0,
  scan_payload TEXT DEFAULT '{}',
  scan_source_host TEXT,
  inventory_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_next_retry ON webhook_deliveries(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_scan_history_user_id ON scan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_created_at ON scan_history(created_at);
CREATE INDEX IF NOT EXISTS idx_scan_history_brand ON scan_history(brand);
