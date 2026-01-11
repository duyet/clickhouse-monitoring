-- Migration: Create audit log table
-- Tracks all sensitive actions for security and compliance
-- Actions: auth.login, auth.logout, auth.failed, host.create, host.update, host.delete,
--          host.test, query.execute, member.invite, member.join, member.remove,
--          member.role_change, org.create, org.update, org.delete

CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "organization_id" TEXT,
  "user_id" TEXT,
  "action" TEXT NOT NULL,
  "resource_type" TEXT NOT NULL,
  "resource_id" TEXT,
  "metadata" TEXT,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Index for querying audit logs by organization
CREATE INDEX IF NOT EXISTS "audit_log_org_idx" ON "audit_log" ("organization_id", "created_at");

-- Index for querying audit logs by user
CREATE INDEX IF NOT EXISTS "audit_log_user_idx" ON "audit_log" ("user_id", "created_at");

-- Index for querying audit logs by action type
CREATE INDEX IF NOT EXISTS "audit_log_action_idx" ON "audit_log" ("action", "created_at");

-- Index for querying audit logs by resource
CREATE INDEX IF NOT EXISTS "audit_log_resource_idx" ON "audit_log" ("resource_type", "resource_id");
