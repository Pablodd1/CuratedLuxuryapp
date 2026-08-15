-- CuratedLux 0003_authposting_credits — Authenticator credits + capped posted-history
-- Adds a credit system (per-scan consumption) and a bounded posted-items log.

-- Users: add credit balance (defaults to a free pool)
ALTER TABLE users ADD COLUMN credits INTEGER NOT NULL DEFAULT 50;
ALTER TABLE users ADD COLUMN credits_used INTEGER NOT NULL DEFAULT 0;

-- Posted items — the authenticator's "post history", capped to a limited count.
-- Every completed authentication/post lands here; oldest rows beyond the cap are
-- pruned by the application layer on each insert.
CREATE TABLE IF NOT EXISTS posted_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  inventory_id TEXT,
  category TEXT DEFAULT '',
  brand TEXT DEFAULT '',
  model TEXT DEFAULT '',
  reference_number TEXT DEFAULT '',
  year INTEGER,
  condition_label TEXT DEFAULT '',
  estimated_value REAL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  confidence INTEGER DEFAULT 0,
  authenticity_status TEXT DEFAULT 'PENDING',
  source TEXT DEFAULT 'ai',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Credit ledger — audit trail of every credit grant or consumption
CREATE TABLE IF NOT EXISTS credit_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_users_credits ON users(credits);
CREATE INDEX IF NOT EXISTS idx_posted_items_user ON posted_items(user_id);
CREATE INDEX IF NOT EXISTS idx_posted_items_created ON posted_items(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user ON credit_ledger(user_id);
