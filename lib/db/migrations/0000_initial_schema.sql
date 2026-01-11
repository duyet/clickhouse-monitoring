-- Initial schema migration for authentication, organization, and host management

-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER, -- timestamp
  name TEXT,
  image TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL, -- timestamp
  token TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  ip_address TEXT,
  user_agent TEXT
);

-- Accounts table for OAuth
CREATE TABLE accounts (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(provider, provider_id)
);

-- Organizations table
CREATE TABLE organizations (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Organization members (junction table)
CREATE TABLE organization_members (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member
  joined_at INTEGER NOT NULL DEFAULT (unixepoch()),
  invited_by TEXT REFERENCES users(id),
  UNIQUE(organization_id, user_id)
);

-- Invitations table
CREATE TABLE invitations (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'member',
  invited_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  accepted_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Hosts table (with encrypted credentials)
CREATE TABLE hosts (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  host TEXT NOT NULL, -- encrypted
  port INTEGER NOT NULL DEFAULT 9000,
  username TEXT NOT NULL, -- encrypted
  password TEXT NOT NULL, -- encrypted
  protocol TEXT NOT NULL DEFAULT 'http',
  secure INTEGER NOT NULL DEFAULT 0,
  skip_verify INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_connected_at INTEGER,
  connection_error TEXT,
  clickhouse_version TEXT,
  cluster_name TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Audit log table
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata TEXT, -- JSON
  success INTEGER NOT NULL,
  old_values TEXT, -- JSON
  new_values TEXT, -- JSON
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Tokens table (for password reset, email verification, etc.)
CREATE TABLE tokens (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- email_verification, password_reset, invite
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexes for performance
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_hosts_org_id ON hosts(organization_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_org_id ON audit_log(organization_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_tokens_user_id ON tokens(user_id);
CREATE INDEX idx_tokens_token ON tokens(token);
