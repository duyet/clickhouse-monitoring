/**
 * Audit Log Schema
 *
 * Defines the schema for recording all significant actions
 * for compliance and debugging purposes.
 */

import { sql } from 'drizzle-orm'
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

/**
 * Audit action types
 */
export const AuditActions = {
  // Authentication
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_FAILED: 'auth.failed',

  // Host management
  HOST_CREATE: 'host.create',
  HOST_UPDATE: 'host.update',
  HOST_DELETE: 'host.delete',
  HOST_TEST: 'host.test',

  // Query execution
  QUERY_EXECUTE: 'query.execute',

  // Member management
  MEMBER_INVITE: 'member.invite',
  MEMBER_JOIN: 'member.join',
  MEMBER_REMOVE: 'member.remove',
  MEMBER_ROLE_CHANGE: 'member.role_change',

  // Organization management
  ORG_CREATE: 'org.create',
  ORG_UPDATE: 'org.update',
  ORG_DELETE: 'org.delete',
} as const

export type AuditAction = (typeof AuditActions)[keyof typeof AuditActions]

/**
 * Resource types for audit logs
 */
export const ResourceTypes = {
  SESSION: 'session',
  HOST: 'host',
  QUERY: 'query',
  MEMBER: 'member',
  ORGANIZATION: 'organization',
  INVITATION: 'invitation',
} as const

export type ResourceType = (typeof ResourceTypes)[keyof typeof ResourceTypes]

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
  (table) => ({
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
 * Type exports
 */
export type AuditLog = typeof auditLog.$inferSelect
export type NewAuditLog = typeof auditLog.$inferInsert
