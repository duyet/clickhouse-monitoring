-- Per-owner daily AI request usage counter (cloud SaaS only).
-- One row per (owner_id, day); written/incremented on every agent request,
-- read by the plan-enforcement gate in the agent route.
-- owner_id mirrors billing-owner ids (Clerk user_* or org_*).
-- day is UTC date in 'YYYY-MM-DD' format.
CREATE TABLE IF NOT EXISTS ai_usage_daily (
  owner_id   TEXT    NOT NULL,
  day        TEXT    NOT NULL,
  count      INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (owner_id, day)
);
