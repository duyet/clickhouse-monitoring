import { sql } from "drizzle-orm"
import {
  integer,
  sqliteTable,
  text,
  real,
  blob,
  primaryKey,
} from "drizzle-orm/sqlite-core"
import { createId } from "@paralleldrive/cuid2"

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$default(() => createId()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  image: text("image"),
  role: text("role").notNull().default("member"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
})

// Accounts table for OAuth providers
export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey().$default(() => createId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  type: text("type").notNull(),
  access_token: text("access_token"),
  refresh_token: text("refresh_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  compoundPrimaryKey: primaryKey({
    columns: [table.provider, table.providerAccountId],
  }),
}))

// Sessions table
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey().$default(() => createId()),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
})

// Verification tokens table
export const verificationTokens = sqliteTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
}, (table) => ({
  compoundPrimaryKey: primaryKey({
    columns: [table.identifier, table.token],
  }),
}))

// Organizations table
export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey().$default(() => createId()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
})

// Organization members table
export const organizationMembers = sqliteTable("organization_members", {
  id: text("id").primaryKey().$default(() => createId()),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // owner, admin, member
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  compoundPrimaryKey: primaryKey({
    columns: [table.organizationId, table.userId],
  }),
}))

// Encrypted hosts table
export const hosts = sqliteTable("hosts", {
  id: text("id").primaryKey().$default(() => createId()),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  host: text("host").notNull(),
  port: integer("port").notNull().default(9000),
  username: text("username").notNull(),
  password: text("password").notNull(), // Encrypted
  database: text("database").default("default"),
  customName: text("custom_name"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
})

// Audit log table
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey().$default(() => createId()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  resource: text("resource"),
  resourceId: text("resource_id"),
  metadata: blob("metadata"), // JSON stored as blob
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
})

// Export all tables
export const dbSchema = {
  users,
  accounts,
  sessions,
  verificationTokens,
  organizations,
  organizationMembers,
  hosts,
  auditLogs,
}