-- CuratedLux v2.0 — Production Schema
-- Tables match the storeValuation(), inventory, requests, matching, and dossier APIs

CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL DEFAULT 'system',
  category TEXT NOT NULL DEFAULT 'Watches',
  brand TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  reference_number TEXT DEFAULT '',
  year INTEGER,
  condition_grade INTEGER DEFAULT 3,
  condition_label TEXT DEFAULT 'Good',
  estimated_value REAL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  confidence INTEGER DEFAULT 0,
  authenticity_status TEXT DEFAULT 'PENDING',
  reasoning TEXT DEFAULT '',
  confidence_logo INTEGER DEFAULT 0,
  confidence_serial INTEGER DEFAULT 0,
  confidence_materials INTEGER DEFAULT 0,
  confidence_bezel INTEGER DEFAULT 0,
  inclusions TEXT DEFAULT '[]',
  image_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_requests (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL DEFAULT '',
  looking_for_brand TEXT NOT NULL DEFAULT '',
  looking_for_model TEXT NOT NULL DEFAULT '',
  budget_usd REAL DEFAULT 0,
  urgency TEXT DEFAULT 'Flexible',
  condition_required INTEGER DEFAULT 3,
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  inventory_id TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES client_requests(id),
  FOREIGN KEY (inventory_id) REFERENCES inventory(id)
);

CREATE TABLE IF NOT EXISTS dossiers (
  id TEXT PRIMARY KEY,
  inventory_id TEXT NOT NULL,
  appraiser TEXT DEFAULT 'CuratedLux AI',
  notes TEXT DEFAULT '',
  certificate_data TEXT DEFAULT '{}',
  export_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventory_id) REFERENCES inventory(id)
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT DEFAULT '',
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_brand ON inventory(brand);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_confidence ON inventory(confidence);
CREATE INDEX IF NOT EXISTS idx_requests_status ON client_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_urgency ON client_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_dossiers_inventory ON dossiers(inventory_id);
