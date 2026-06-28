-- Forever-retention store for the anonymous instance ping.
-- Analytics Engine keeps data for only 3 months; D1 keeps these rows
-- indefinitely. One row per install per UTC day (INSERT OR IGNORE dedupes), so
-- distinct installs per day = COUNT(*) grouped by day.

CREATE TABLE IF NOT EXISTS ping_daily (
  day           TEXT NOT NULL,            -- 'YYYY-MM-DD' (UTC)
  instance_hash TEXT NOT NULL,            -- opaque SHA-256 install id
  deploy_target TEXT NOT NULL DEFAULT 'unknown',
  ch_version    TEXT,                     -- 'MAJOR.MINOR' or NULL
  PRIMARY KEY (day, instance_hash)
);

CREATE INDEX IF NOT EXISTS idx_ping_daily_day ON ping_daily (day);
