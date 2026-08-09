-- CuratedLux D1 Schema v2.0
-- Luxury Asset Valuation & Trade Intake System

-- Inventory items (seller listings)
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('Watches', 'Handbags', 'Fine Jewelry', 'Art & Collectibles', 'Luxury Vehicles')),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  reference_number TEXT DEFAULT '',
  year INTEGER,
  condition_grade INTEGER DEFAULT 3 CHECK(condition_grade BETWEEN 0 AND 4),
  condition_label TEXT DEFAULT 'Good',
  estimated_value REAL NOT NULL CHECK(estimated_value >= 0),
  currency TEXT DEFAULT 'USD',
  confidence INTEGER DEFAULT 0 CHECK(confidence BETWEEN 0 AND 100),
  authenticity_status TEXT DEFAULT 'PENDING',
  reasoning TEXT DEFAULT '',
  confidence_logo INTEGER DEFAULT 0,
  confidence_serial INTEGER DEFAULT 0,
  confidence_materials INTEGER DEFAULT 0,
  confidence_bezel INTEGER DEFAULT 0,
  inclusions TEXT DEFAULT '[]',
  image_data TEXT DEFAULT '',
  image_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'locked', 'sold', 'archived')),
  escrow_amount REAL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Client sourcing requests (buyer wants)
CREATE TABLE IF NOT EXISTS client_requests (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  looking_for_brand TEXT NOT NULL,
  looking_for_model TEXT NOT NULL,
  reference_number TEXT DEFAULT '',
  budget_usd REAL NOT NULL CHECK(budget_usd >= 0),
  currency TEXT DEFAULT 'USD',
  urgency TEXT DEFAULT 'Flexible' CHECK(urgency IN ('Immediate', '1-2 weeks', 'Flexible')),
  condition_required INTEGER DEFAULT 3 CHECK(condition_required BETWEEN 0 AND 4),
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'matched', 'fulfilled', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Matchmaking results
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  inventory_id TEXT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL REFERENCES client_requests(id) ON DELETE CASCADE,
  brand_score REAL DEFAULT 0,
  model_score REAL DEFAULT 0,
  price_score REAL DEFAULT 0,
  condition_score REAL DEFAULT 0,
  overall_score REAL NOT NULL,
  match_status TEXT DEFAULT 'pending' CHECK(match_status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Appraisal dossiers (verified authenticity reports)
CREATE TABLE IF NOT EXISTS dossiers (
  id TEXT PRIMARY KEY,
  inventory_id TEXT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL,
  appraiser_name TEXT DEFAULT '',
  appraiser_signature TEXT DEFAULT '',
  qr_verification_code TEXT DEFAULT '',
  device_hash TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  export_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- User profiles
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  company_name TEXT DEFAULT '',
  role TEXT DEFAULT 'Licensed Dealer',
  tier TEXT DEFAULT 'Starter' CHECK(tier IN ('Enterprise VIP', 'Pro Dealer', 'Starter')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Activity audit log
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_owner ON inventory(owner_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_brand ON inventory(brand);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_client_requests_owner ON client_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_client_requests_status ON client_requests(status);
CREATE INDEX IF NOT EXISTS idx_matches_inventory ON matches(inventory_id);
CREATE INDEX IF NOT EXISTS idx_matches_request ON matches(request_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_inventory ON dossiers(inventory_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at);
