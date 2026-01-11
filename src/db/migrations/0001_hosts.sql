-- Migration: Create ClickHouse host configuration table
-- This table stores database hosts added by users through the UI
-- Passwords are encrypted with AES-256-GCM using AUTH_SECRET

CREATE TABLE IF NOT EXISTS "clickhouse_host" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "organization_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "host" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "password_encrypted" TEXT NOT NULL,
  "timezone" TEXT,
  "max_execution_time" INTEGER DEFAULT 60,
  "is_active" INTEGER NOT NULL DEFAULT 1,
  "sort_order" INTEGER DEFAULT 0,
  "created_at" INTEGER NOT NULL DEFAULT (unixepoch()),
  "created_by" TEXT NOT NULL,
  "updated_at" INTEGER,
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE
);

-- Index for efficient organization-based queries
CREATE UNIQUE INDEX IF NOT EXISTS "clickhouse_host_org_name_idx" ON "clickhouse_host" ("organization_id", "name");

-- Index for sorting hosts within an organization
CREATE INDEX IF NOT EXISTS "clickhouse_host_org_sort_idx" ON "clickhouse_host" ("organization_id", "sort_order");
