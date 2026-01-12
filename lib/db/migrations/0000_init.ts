import type { MigrationContext } from "drizzle-orm/better-sqlite3"
import { sql } from "drizzle-orm"
import { integer, sqliteTable, text, blob, primaryKey } from "drizzle-orm/sqlite-core"

export function up({ db }: MigrationContext) {
  // Users table
  db.execute(sql`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER BOOLEAN DEFAULT 0,
      image TEXT,
      role TEXT NOT NULL DEFAULT 'member',
      created_at INTEGER TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at INTEGER TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Accounts table for OAuth providers
  db.execute(sql`
    CREATE TABLE accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      type TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      expires_at INTEGER,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT,
      created_at INTEGER TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT accounts_provider_provider_account_id_key UNIQUE (provider, provider_account_id)
    )
  `)

  // Sessions table
  db.execute(sql`
    CREATE TABLE sessions (
      id TEXT PRIMARY KEY,
      session_token TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      expires INTEGER NOT NULL,
      created_at INTEGER TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Verification tokens table
  db.execute(sql`
    CREATE TABLE verification_tokens (
      identifier TEXT NOT NULL,
      token TEXT NOT NULL,
      expires INTEGER NOT NULL,
      CONSTRAINT verification_tokens_identifier_token_key UNIQUE (identifier, token)
    )
  `)

  // Organizations table
  db.execute(sql`
    CREATE TABLE organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at INTEGER TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at INTEGER TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Organization members table
  db.execute(sql`
    CREATE TABLE organization_members (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      created_at INTEGER TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT organization_members_organization_id_user_id_key UNIQUE (organization_id, user_id),
      CONSTRAINT organization_members_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      CONSTRAINT organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Encrypted hosts table
  db.execute(sql`
    CREATE TABLE hosts (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      host TEXT NOT NULL,
      port INTEGER NOT NULL DEFAULT 9000,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      database TEXT DEFAULT 'default',
      custom_name TEXT,
      is_active INTEGER BOOLEAN DEFAULT 1,
      created_at INTEGER TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at INTEGER TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT hosts_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    )
  `)

  // Audit log table
  db.execute(sql`
    CREATE TABLE audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      organization_id TEXT,
      action TEXT NOT NULL,
      resource TEXT,
      resource_id TEXT,
      metadata BLOB,
      ip_address TEXT,
      user_agent TEXT,
      created_at INTEGER TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT audit_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `)

  // Create indexes for better performance
  db.execute(sql`CREATE INDEX idx_users_email ON users(email)`)
  db.execute(sql`CREATE INDEX idx_accounts_user_id ON accounts(user_id)`)
  db.execute(sql`CREATE INDEX idx_sessions_user_id ON sessions(user_id)`)
  db.execute(sql`CREATE INDEX idx_hosts_organization_id ON hosts(organization_id)`)
  db.execute(sql`CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id)`)
  db.execute(sql`CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id)`)
  db.execute(sql`CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at)`)
}

export function down({ db }: MigrationContext) {
  // Drop tables in reverse order
  db.execute(sql`DROP INDEX IF EXISTS idx_audit_logs_created_at`)
  db.execute(sql`DROP INDEX IF EXISTS idx_audit_logs_organization_id`)
  db.execute(sql`DROP INDEX IF EXISTS idx_audit_logs_user_id`)
  db.execute(sql`DROP INDEX IF EXISTS idx_hosts_organization_id`)
  db.execute(sql`DROP INDEX IF EXISTS idx_sessions_user_id`)
  db.execute(sql`DROP INDEX IF EXISTS idx_accounts_user_id`)
  db.execute(sql`DROP INDEX IF EXISTS idx_users_email`)

  db.execute(sql`DROP TABLE IF EXISTS audit_logs`)
  db.execute(sql`DROP TABLE IF EXISTS hosts`)
  db.execute(sql`DROP TABLE IF EXISTS organization_members`)
  db.execute(sql`DROP TABLE IF EXISTS organizations`)
  db.execute(sql`DROP TABLE IF EXISTS verification_tokens`)
  db.execute(sql`DROP TABLE IF EXISTS sessions`)
  db.execute(sql`DROP TABLE IF EXISTS accounts`)
  db.execute(sql`DROP TABLE IF EXISTS users`)
}