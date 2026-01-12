import { sql } from 'drizzle-orm'
import {
  integer,
  text,
  sqliteTable,
  pgTable,
  timestamp,
  unique,
} from 'drizzle-orm/sqlite-core'
import { createId } from '@paralleldrive/cuid2'

// Auth tables (managed by Better Auth)
export const users = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$default(() => createId()),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`CURRENT_TIMESTAMP`
  ),
})

export const accounts = sqliteTable(
  'accounts',
  {
    id: text('id')
      .primaryKey()
      .$default(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    type: text('type').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
    oauth_token_secret: text('oauth_token_secret'),
    oauth_token: text('oauth_token'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (t) => ({
    compoundPrimaryKey: unique().on(t.provider, t.providerAccountId),
  })
)

export const sessions = sqliteTable('sessions', {
  id: text('id')
    .primaryKey()
    .$default(() => createId()),
  sessionToken: text('session_token').notNull().unique(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`CURRENT_TIMESTAMP`
  ),
})

export const verificationTokens = sqliteTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull().unique(),
    expires: integer('expires', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (t) => ({
    compoundPrimaryKey: unique().on(t.identifier, t.token),
  })
)

// Organization tables
export const organizations = sqliteTable('organizations', {
  id: text('id')
    .primaryKey()
    .$default(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`CURRENT_TIMESTAMP`
  ),
})

export const organizationMembers = sqliteTable(
  'organization_members',
  {
    id: text('id')
      .primaryKey()
      .$default(() => createId()),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'), // owner, admin, member
    joinedAt: integer('joined_at', { mode: 'timestamp' }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(
      sql`CURRENT_TIMESTAMP`
    ),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
      sql`CURRENT_TIMESTAMP`
    ),
  },
  (t) => ({
    compoundPrimaryKey: unique().on(t.organizationId, t.userId),
  })
)

// Host management tables
export const hosts = sqliteTable('hosts', {
  id: text('id')
    .primaryKey()
    .$default(() => createId()),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  host: text('host').notNull(),
  port: integer('port').default(9000),
  username: text('username'),
  // This field will store encrypted credentials
  encryptedCredentials: text('encrypted_credentials'),
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`CURRENT_TIMESTAMP`
  ),
})

// Audit log table
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id')
    .primaryKey()
    .$default(() => createId()),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  organizationId: text('organization_id').references(() => organizations.id, {
    onDelete: 'set null',
  }),
  action: text('action').notNull(),
  resource: text('resource'),
  resourceId: text('resource_id'),
  metadata: text('metadata'), // JSON string for additional data
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`CURRENT_TIMESTAMP`
  ),
})
