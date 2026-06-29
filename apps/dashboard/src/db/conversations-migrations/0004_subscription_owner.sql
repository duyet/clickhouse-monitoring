-- Add owner_type column to user_subscriptions to distinguish org-owned from
-- user-owned subscriptions.  The primary key column (user_id) now holds the
-- billing-owner id — either a Clerk user id (user_*) or a Clerk org id (org_*).
-- All existing rows remain valid: they are user-owned by default.
ALTER TABLE user_subscriptions ADD COLUMN owner_type TEXT NOT NULL DEFAULT 'user';

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_owner_type
  ON user_subscriptions(owner_type);
