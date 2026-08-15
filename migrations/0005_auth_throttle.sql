-- CuratedLux 0005 — durable auth throttling table (audit H3)
-- Brute-force counters shared across Workers isolates/colos.
CREATE TABLE IF NOT EXISTS auth_throttle (
  k TEXT PRIMARY KEY,      -- email|ip composite key
  fails INTEGER NOT NULL DEFAULT 0,
  ts INTEGER NOT NULL      -- epoch ms of first/last fail in window
);
