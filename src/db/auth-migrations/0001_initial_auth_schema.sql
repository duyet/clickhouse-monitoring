-- Initial schema for ClickHouse Monitor auth tables (D1 version)
-- This migration is for Cloudflare D1 database
-- Run with: wrangler d1 migrations apply clickhouse-monitor-auth

-- ClickHouse Host configuration table
CREATE TABLE IF NOT EXISTS "clickhouse_host" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "name" text NOT NULL,
  "host" text NOT NULL,
  "username" text NOT NULL,
  "password_encrypted" text NOT NULL,
  "timezone" text,
  "max_execution_time" integer DEFAULT 60,
  "is_active" integer NOT NULL DEFAULT 1,
  "sort_order" integer DEFAULT 0,
  "created_at" integer NOT NULL DEFAULT (unixepoch()),
  "created_by" text NOT NULL,
  "updated_at" integer
);

CREATE UNIQUE INDEX IF NOT EXISTS "clickhouse_host_org_idx" on "clickhouse_host" ("organization_id", "name");

-- Audit log table
CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text,
  "user_id" text,
  "action" text NOT NULL,
  "resource_type" text NOT NULL,
  "resource_id" text,
  "metadata" text,
  "ip_address" text,
  "user_agent" text,
  "created_at" integer NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS "audit_log_org_idx" on "audit_log" ("organization_id", "created_at");
CREATE INDEX IF NOT EXISTS "audit_log_user_idx" on "audit_log" ("user_id", "created_at");
