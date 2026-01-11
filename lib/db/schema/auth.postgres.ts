import { sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

/**
 * ClickHouse Host table (PostgreSQL version)
 * Stores connection details for ClickHouse instances
 * References Better Auth managed organization table via organization_id
 */
export const clickhouseHost = pgTable(
  'clickhouse_host',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id').notNull(),
    name: text('name').notNull(),
    host: text('host').notNull(),
    username: text('username').notNull(),
    passwordEncrypted: text('password_encrypted').notNull(),
    timezone: text('timezone'),
    maxExecutionTime: integer('max_execution_time').default(60),
    isActive: boolean('is_active').default(true).notNull(),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at').notNull().default(sql`now()`),
    createdBy: text('created_by').notNull(),
    updatedAt: timestamp('updated_at').default(sql`now()`),
  },
  (table: any) => ({
    orgIdx: uniqueIndex('clickhouse_host_org_idx').on(
      table.organizationId,
      table.name
    ),
  })
)

/**
 * Audit Log table (PostgreSQL version)
 * Records all significant actions for compliance and debugging
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id'),
    userId: text('user_id'),
    action: text('action').notNull(),
    resourceType: text('resource_type').notNull(),
    resourceId: text('resource_id'),
    metadata: text('metadata'), // JSON string
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').notNull().default(sql`now()`),
  },
  (table: any) => ({
    orgIdx: uniqueIndex('audit_log_org_idx').on(
      table.organizationId,
      table.createdAt
    ),
    userIdx: uniqueIndex('audit_log_user_idx').on(
      table.userId,
      table.createdAt
    ),
  })
)

/**
 * Type exports for custom tables
 * Note: Organization and Member types are managed by Better Auth
 */
export type ClickhouseHost = typeof clickhouseHost.$inferSelect
export type NewClickhouseHost = typeof clickhouseHost.$inferInsert

export type AuditLog = typeof auditLog.$inferSelect
export type NewAuditLog = typeof auditLog.$inferInsert
