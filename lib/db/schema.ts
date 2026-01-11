/**
 * Database schema using Drizzle ORM
 * Supports multi-tenant authentication, organizations, and secure host management
 */

import {
  sqliteTable,
  text,
  integer,
  real,
} from 'drizzle-orm/sqlite-core'
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'

// ===== AUTHENTICATION =====

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'timestamp' }).$onUpdate(() => new Date()),
  name: text('name'),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$default(() => new Date()).$onUpdate(() => new Date()),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
})

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // 'github', 'google'
  providerId: text('provider_id').notNull(), // OAuth user ID
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$default(() => new Date()).$onUpdate(() => new Date()),
})

// ===== ORGANIZATIONS & TEAMS =====

export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  logoUrl: text('logo_url'),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$default(() => new Date()).$onUpdate(() => new Date()),
})

export const organizationMembers = sqliteTable('organization_members', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['owner', 'admin', 'member'] }).notNull().default('member'),
  joinedAt: integer('joined_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
  invitedBy: text('invited_by').references(() => users.id),
})

export const invitations = sqliteTable('invitations', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  role: text('role', { enum: ['owner', 'admin', 'member'] }).notNull().default('member'),
  invitedBy: text('invited_by')
    .notNull()
    .references(() => users.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  acceptedAt: integer('accepted_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
})

// ===== HOST MANAGEMENT =====

export const hosts = sqliteTable('hosts', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),

  // Encrypted connection details
  host: text('host').notNull(), // Encrypted: hostname or IP
  port: integer('port').notNull().default(9000),
  username: text('username').notNull(), // Encrypted
  password: text('password').notNull(), // Encrypted (AES-256-GCM)

  // Connection settings
  protocol: text('protocol', { enum: ['http', 'https'] }).notNull().default('http'),
  secure: integer('secure', { mode: 'boolean' }).notNull().default(false),
  skipVerify: integer('skip_verify', { mode: 'boolean' }).notNull().default(false),

  // Status and metadata
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastConnectedAt: integer('last_connected_at', { mode: 'timestamp' }),
  connectionError: text('connection_error'),

  // ClickHouse specific
  clickhouseVersion: text('clickhouse_version'),
  clusterName: text('cluster_name'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$default(() => new Date()).$onUpdate(() => new Date()),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id),
})

// ===== AUDIT LOG =====

export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .references(() => organizations.id, { onDelete: 'set null' }),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'set null' }),

  action: text('action').notNull(), // e.g., 'user.login', 'host.create', 'organization.invite'
  resourceType: text('resource_type'), // e.g., 'host', 'organization', 'user'
  resourceId: text('resource_id'),

  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),

  // Event details
  metadata: text('metadata', { mode: 'json' }), // Additional context as JSON
  success: integer('success', { mode: 'boolean' }).notNull(),

  // Changes for audit trail
  oldValues: text('old_values', { mode: 'json' }),
  newValues: text('new_values', { mode: 'json' }),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
})

// ===== INVITE TOKENS (Forgot Password, etc.) =====

export const tokens = sqliteTable('tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  type: text('type', { enum: ['email_verification', 'password_reset', 'invite'] }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
})

// ===== TYPE INFERENCE =====

export type User = InferSelectModel<typeof users>
export type InsertUser = InferInsertModel<typeof users>

export type Session = InferSelectModel<typeof sessions>
export type InsertSession = InferInsertModel<typeof sessions>

export type Account = InferSelectModel<typeof accounts>
export type InsertAccount = InferInsertModel<typeof accounts>

export type Organization = InferSelectModel<typeof organizations>
export type InsertOrganization = InferInsertModel<typeof organizations>

export type OrganizationMember = InferSelectModel<typeof organizationMembers>
export type InsertOrganizationMember = InferInsertModel<typeof organizationMembers>

export type Invitation = InferSelectModel<typeof invitations>
export type InsertInvitation = InferInsertModel<typeof invitations>

export type Host = InferSelectModel<typeof hosts>
export type InsertHost = InferInsertModel<typeof hosts>

export type AuditLog = InferSelectModel<typeof auditLog>
export type InsertAuditLog = InferInsertModel<typeof auditLog>

export type Token = InferSelectModel<typeof tokens>
export type InsertToken = InferInsertModel<typeof tokens>
