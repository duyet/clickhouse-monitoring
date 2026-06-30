-- Enrich the auth identity mirror (0006) with the fuller set of fields upstream
-- providers expose. Additive only: SQLite permits one ADD COLUMN per statement
-- and an added column can't be NOT NULL without a default, so every field is
-- nullable (absent = the provider didn't report it). Booleans are stored as
-- INTEGER 0/1; metadata / lists are stored as JSON TEXT.

-- auth_users -----------------------------------------------------------------
ALTER TABLE auth_users ADD COLUMN provider_external_id TEXT;  -- the user's own external id set in the provider
ALTER TABLE auth_users ADD COLUMN phone_number TEXT;          -- primary phone, if any
ALTER TABLE auth_users ADD COLUMN email_verified INTEGER;     -- 0/1: primary email verified
ALTER TABLE auth_users ADD COLUMN two_factor_enabled INTEGER; -- 0/1
ALTER TABLE auth_users ADD COLUMN banned INTEGER;             -- 0/1
ALTER TABLE auth_users ADD COLUMN locked INTEGER;             -- 0/1
ALTER TABLE auth_users ADD COLUMN has_image INTEGER;          -- 0/1
ALTER TABLE auth_users ADD COLUMN last_active_at INTEGER;     -- unix seconds
ALTER TABLE auth_users ADD COLUMN external_accounts TEXT;     -- JSON array of linked OAuth providers, e.g. ["google","github"]
ALTER TABLE auth_users ADD COLUMN public_metadata TEXT;       -- JSON object

-- auth_organizations ---------------------------------------------------------
ALTER TABLE auth_organizations ADD COLUMN max_allowed_memberships INTEGER;
ALTER TABLE auth_organizations ADD COLUMN admin_delete_enabled INTEGER;  -- 0/1
ALTER TABLE auth_organizations ADD COLUMN has_image INTEGER;             -- 0/1
ALTER TABLE auth_organizations ADD COLUMN public_metadata TEXT;          -- JSON object

-- auth_org_memberships -------------------------------------------------------
ALTER TABLE auth_org_memberships ADD COLUMN permissions TEXT;      -- JSON array of permission strings
ALTER TABLE auth_org_memberships ADD COLUMN public_metadata TEXT;  -- JSON object
ALTER TABLE auth_org_memberships ADD COLUMN updated_at INTEGER;    -- unix seconds (membership updatedAt)
