/**
 * Database connection and utilities using Drizzle ORM
 */

import { drizzle } from 'drizzle-orm/better-sqlite3'
import { Database } from 'better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'
import { env } from '../env'

// Create database connection
let db: Database

if (env.DB_DIALECT === 'sqlite') {
  db = new Database(env.DATABASE_URL.replace('file:', ''), {
    nativeBinding: require.resolve('better-sqlite3'),
  })
}

// Initialize Drizzle instance
export const dbInstance = drizzle(db, { schema })

// Type-safe database client
export const db = {
  ...dbInstance,
  // Add convenience methods
  findUserById: (id: string) => dbInstance.query.users.findFirst({ where: (users, { eq }) => eq(users.id, id) }),
  findUserByEmail: (email: string) => dbInstance.query.users.findFirst({ where: (users, { eq }) => eq(users.email, email) }),
  findSessionByToken: (token: string) => dbInstance.query.sessions.findFirst({
    where: (sessions, { eq }) => eq(sessions.token, token),
    with: { user: true }
  }),
  findOrganizationBySlug: (slug: string) => dbInstance.query.organizations.findFirst({
    where: (organizations, { eq }) => eq(organizations.slug, slug),
    with: { members: { with: { user: true } } }
  }),
  findHostsByOrganization: (organizationId: string) => dbInstance.query.hosts.findMany({
    where: (hosts, { eq }) => eq(hosts.organizationId, organizationId),
    orderBy: (hosts, { desc }) => desc(hosts.createdAt)
  }),
  findActiveHostsByOrganization: (organizationId: string) => dbInstance.query.hosts.findMany({
    where: (hosts, { eq, and }) => and(
      eq(hosts.organizationId, organizationId),
      eq(hosts.isActive, true)
    )
  }),
  getOrganizationMembers: (organizationId: string) => dbInstance.query.organizationMembers.findMany({
    where: (members, { eq }) => eq(members.organizationId, organizationId),
    with: { user: true }
  }),
  findActiveInvitations: (email: string) => dbInstance.query.invitations.findMany({
    where: (invitations, { and, eq, gt }) => and(
      eq(invitations.email, email),
      gt(invitations.expiresAt, new Date())
    )
  }),
  logAuditEvent: (data: Omit<schema.InsertAuditLog, 'id' | 'createdAt'>) =>
    dbInstance.insert(schema.auditLog).values(data).returning().get(),
}

// Migration helpers
export async function initializeDatabase() {
  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON')

  // Create extensions if needed
  try {
    db.exec('SELECT json_object(1, 2)')
  } catch (error) {
    console.warn('JSON1 extension not available, some features may be limited')
  }
}

// Close connection gracefully (for testing)
export function closeDatabase() {
  db.close()
}

// Export schema for TypeScript
export type {
  User,
  InsertUser,
  Session,
  InsertSession,
  Account,
  InsertAccount,
  Organization,
  InsertOrganization,
  OrganizationMember,
  InsertOrganizationMember,
  Invitation,
  InsertInvitation,
  Host,
  InsertHost,
  AuditLog,
  InsertAuditLog,
  Token,
  InsertToken,
} from './schema'