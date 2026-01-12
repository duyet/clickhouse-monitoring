import { sql } from 'drizzle-orm'
import { integer, text, sqliteTable, real, blob, unique, index } from 'drizzle-orm/sqlite-core'

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  role: text('role').notNull().default('user'), // 'admin', 'user'
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
}))

// Organizations table
export const organizations = sqliteTable('organizations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  avatar: text('avatar'),
  settings: text('settings'), // JSON string for organization settings
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  slugIdx: index('organizations_slug_idx').on(table.slug),
}))

// Organization members table
export const organizationMembers = sqliteTable('organization_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'), // 'owner', 'admin', 'member'
  invitedBy: integer('invited_by').references(() => users.id),
  acceptedAt: integer('accepted_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  orgUserIdx: unique('org_user_idx').on(table.organizationId, table.userId),
  orgIdIdx: index('org_members_org_id_idx').on(table.organizationId),
  userIdIdx: index('org_members_user_id_idx').on(table.userId),
}))

// Hosts table with encryption
export const hosts = sqliteTable('hosts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  host: text('host').notNull(),
  port: integer('port').default(9000),
  username: text('username'),
  // Encrypted password
  encryptedPassword: blob('encrypted_password'),
  // Encryption metadata
  encryptionKeyVersion: integer('encryption_key_version').default(1),
  database: text('database'),
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  lastConnectedAt: integer('last_connected_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  orgIdIdx: index('hosts_org_id_idx').on(table.organizationId),
}))

// Sessions table for Better Auth
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
  expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt),
}))

// Account table for Better Auth (OAuth providers)
export const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  providerId: text('provider_id').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  type: text('type').notNull(),
  access_token: text('access_token'),
  refresh_token: text('refresh_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
  oauth_token_secret: text('oauth_token_secret'),
  oauth_token: text('oauth_token'),
}, (table) => ({
  userIdProviderIdx: unique('account_user_id_provider_idx').on(table.userId, table.providerId, table.providerAccountId),
  userIdIdx: index('accounts_user_id_idx').on(table.userId),
}))

// Verification tokens table for email verification
export const verificationTokens = sqliteTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  identifierTokenIdx: unique('verification_tokens_identifier_token_idx').on(table.identifier, table.token),
}))

// Audit log table for security events
export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  organizationId: integer('organization_id').references(() => organizations.id),
  action: text('action').notNull(), // 'login', 'logout', 'create_host', 'delete_host', etc.
  resource: text('resource'), // Resource type affected
  resourceId: text('resource_id'), // Resource ID
  metadata: text('metadata'), // JSON string for additional data
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  status: text('status').notNull(), // 'success', 'failed', 'pending'
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
  orgIdIdx: index('audit_logs_org_id_idx').on(table.organizationId),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
}))

// Host connection history table
export const hostConnections = sqliteTable('host_connections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  hostId: integer('host_id').notNull().references(() => hosts.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // 'success', 'failed', 'timeout'
  error: text('error'),
  responseTime: integer('response_time'), // milliseconds
  checkedAt: integer('checked_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  hostIdIdx: index('host_connections_host_id_idx').on(table.hostId),
  createdAtIdx: index('host_connections_created_at_idx').on(table.checkedAt),
}))

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Organization = typeof organizations.$inferSelect
export type NewOrganization = typeof organizations.$inferInsert
export type OrganizationMember = typeof organizationMembers.$inferSelect
export type NewOrganizationMember = typeof organizationMembers.$inferInsert
export type Host = typeof hosts.$inferSelect
export type NewHost = typeof hosts.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert
export type HostConnection = typeof hostConnections.$inferSelect
export type NewHostConnection = typeof hostConnections.$inferInsert