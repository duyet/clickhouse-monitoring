import { sql } from 'drizzle-orm'
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

/**
 * ClickHouse Host table
 * Stores connection details for ClickHouse instances
 * References Better Auth managed organization table via organization_id
 */
export const clickhouseHost = sqliteTable(
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
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    sortOrder: integer('sort_order').default(0),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    createdBy: text('created_by').notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
      sql`(unixepoch())`
    ),
  },
  (table: any) => ({
    orgIdx: uniqueIndex('clickhouse_host_org_idx').on(
      table.organizationId,
      table.name
    ),
  })
)

/**
 * Audit Log table
 * Records all significant actions for compliance and debugging
 */
export const auditLog = sqliteTable(
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
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
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
