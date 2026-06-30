-- Provider-agnostic mirror of upstream auth identity (cloud SaaS only).
--
-- Until now auth identity (users/orgs) was referenced only by id and org
-- membership was resolved live per request. These tables hold a backfilled
-- snapshot of every upstream user, organization, and membership so the
-- dashboard can list/join customers locally (billing-owner lookups, admin
-- views) without an upstream round-trip.
--
-- Multi-provider by design: `provider` names the upstream identity source
-- ('clerk' today; another adapter can be added without schema change) and
-- `external_id` is that provider's id (user_* / org_* for Clerk). Rows are
-- keyed on (provider, external_id) so providers never collide. Populated by
-- scripts/sync-clerk.ts via the IdentityProvider adapter (idempotent upsert).
--
-- All timestamps are unix SECONDS (Clerk returns ms; the sync converts) to
-- match the rest of CHM_CLOUD_D1. synced_at records the last write.

CREATE TABLE IF NOT EXISTS auth_users (
  provider TEXT NOT NULL,         -- upstream identity provider, e.g. 'clerk'
  external_id TEXT NOT NULL,      -- provider's user id (user_* for Clerk)
  primary_email TEXT,
  first_name TEXT,
  last_name TEXT,
  username TEXT,
  image_url TEXT,
  created_at INTEGER,             -- unix seconds (upstream createdAt)
  updated_at INTEGER,            -- unix seconds (upstream updatedAt)
  last_sign_in_at INTEGER,       -- unix seconds, nullable
  synced_at INTEGER NOT NULL,
  PRIMARY KEY (provider, external_id)
);

CREATE TABLE IF NOT EXISTS auth_organizations (
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,      -- provider's org id (org_* for Clerk)
  name TEXT NOT NULL,
  slug TEXT,
  image_url TEXT,
  created_by TEXT,               -- provider user id of the creator
  members_count INTEGER,
  created_at INTEGER,
  updated_at INTEGER,
  synced_at INTEGER NOT NULL,
  PRIMARY KEY (provider, external_id)
);

CREATE TABLE IF NOT EXISTS auth_org_memberships (
  provider TEXT NOT NULL,
  org_external_id TEXT NOT NULL,  -- provider org id
  user_external_id TEXT NOT NULL, -- provider user id
  role TEXT,                     -- e.g. 'org:admin' | 'org:member'
  created_at INTEGER,
  synced_at INTEGER NOT NULL,
  PRIMARY KEY (provider, org_external_id, user_external_id)
);

CREATE INDEX IF NOT EXISTS idx_auth_org_memberships_user
  ON auth_org_memberships(provider, user_external_id);

CREATE INDEX IF NOT EXISTS idx_auth_users_email
  ON auth_users(primary_email);
