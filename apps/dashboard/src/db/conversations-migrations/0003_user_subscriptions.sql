-- Per-user billing subscription state (cloud SaaS only).
-- One row per Clerk user; written by the Polar webhook, read by getUserPlan().
-- Lives in the shared CHM_CLOUD_D1 database alongside conversations +
-- user_connections (all keyed by user_id).
CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id TEXT PRIMARY KEY,
  -- 'free' | 'pro' | 'max' | 'enterprise' — resolved from the Polar product id.
  plan_id TEXT NOT NULL,
  -- 'monthly' | 'yearly' | NULL (free).
  billing_period TEXT,
  -- Polar subscription status: active | trialing | past_due | canceled | etc.
  status TEXT NOT NULL,
  polar_subscription_id TEXT,
  polar_customer_id TEXT,
  -- Unix seconds; end of the current paid period (access valid until then).
  current_period_end INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan
  ON user_subscriptions(plan_id);
