-- Per-user ClickHouse connection credentials (encrypted at rest).
-- Also stores short-lived browser connection session tokens.

CREATE TABLE IF NOT EXISTS user_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  host_url TEXT NOT NULL,
  ch_user TEXT NOT NULL,
  host_id INTEGER NOT NULL,
  encrypted_payload TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_connections_user_id
  ON user_connections(user_id);

CREATE TABLE IF NOT EXISTS connection_sessions (
  token TEXT PRIMARY KEY,
  encrypted_payload TEXT NOT NULL,
  user_id TEXT,
  fingerprint TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_connection_sessions_expires
  ON connection_sessions(expires_at);