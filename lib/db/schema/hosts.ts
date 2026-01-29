/**
 * ClickHouse Host Schema
 *
 * Defines the schema for storing ClickHouse connection details.
 * References Better Auth managed organization table via organization_id.
 */

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
  (table) => ({
    orgIdx: uniqueIndex('clickhouse_host_org_idx').on(
      table.organizationId,
      table.name
    ),
  })
)

/**
 * Type exports
 */
export type ClickhouseHost = typeof clickhouseHost.$inferSelect
export type NewClickhouseHost = typeof clickhouseHost.$inferInsert
