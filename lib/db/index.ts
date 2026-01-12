import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'
import { eq } from 'drizzle-orm'
import { sqliteTable, sqliteTableCreator } from 'drizzle-orm/sqlite-core'

// Create a table creator for migrations
export const createTable = sqliteTableCreator((name) => `clickhouse_monitor_${name}`)

// Initialize database connection
const sqlite = new Database('./sqlite.db')
export const db = drizzle(sqlite, { schema })

// Export all schema tables and types
export * from './schema'
export * from './encryption'
export * from './audit-logger'

// Repository pattern for data access
export class UserRepository {
  async findById(id: number) {
    return db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1)
  }

  async findByEmail(email: string) {
    return db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1)
  }

  async create(data: Omit<schema.NewUser, 'id' | 'createdAt' | 'updatedAt'>) {
    const result = await db.insert(schema.users).values(data).returning()
    return result[0]
  }

  async update(id: number, data: Partial<schema.NewUser>) {
    const result = await db
      .update(schema.users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning()
    return result[0]
  }

  async delete(id: number) {
    await db.delete(schema.users).where(eq(schema.users.id, id))
  }
}

export class OrganizationRepository {
  async findById(id: number) {
    return db.select().from(schema.organizations).where(eq(schema.organizations.id, id)).limit(1)
  }

  async findBySlug(slug: string) {
    return db.select().from(schema.organizations).where(eq(schema.organizations.slug, slug)).limit(1)
  }

  async create(data: Omit<schema.NewOrganization, 'id' | 'createdAt' | 'updatedAt'>) {
    const result = await db.insert(schema.organizations).values(data).returning()
    return result[0]
  }

  async update(id: number, data: Partial<schema.NewOrganization>) {
    const result = await db
      .update(schema.organizations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.organizations.id, id))
      .returning()
    return result[0]
  }

  async delete(id: number) {
    await db.delete(schema.organizations).where(eq(schema.organizations.id, id))
  }

  async getMembers(organizationId: number) {
    return db
      .select()
      .from(schema.organizationMembers)
      .where(eq(schema.organizationMembers.organizationId, organizationId))
      .leftJoin(schema.users, eq(schema.organizationMembers.userId, schema.users.id))
      .then(rows => rows.map(row => ({
        ...row.organization_members,
        user: row.users
      })))
  }

  async addMember(organizationId: number, userId: number, role: string) {
    return db.insert(schema.organizationMembers).values({
      organizationId,
      userId,
      role,
    }).returning()
  }
}

export class HostRepository {
  async findById(id: number) {
    return db.select().from(schema.hosts).where(eq(schema.hosts.id, id)).limit(1)
  }

  async findByOrganizationId(organizationId: number) {
    return db.select().from(schema.hosts).where(eq(schema.hosts.organizationId, organizationId))
  }

  async create(data: Omit<schema.NewHost, 'id' | 'createdAt' | 'updatedAt'>) {
    const result = await db.insert(schema.hosts).values(data).returning()
    return result[0]
  }

  async update(id: number, data: Partial<schema.NewHost>) {
    const result = await db
      .update(schema.hosts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.hosts.id, id))
      .returning()
    return result[0]
  }

  async delete(id: number) {
    await db.delete(schema.hosts).where(eq(schema.hosts.id, id))
  }

  async testConnection(id: number) {
    const host = await this.findById(id)
    if (!host) throw new Error('Host not found')

    // Here you would implement actual connection testing
    // For now, return a mock success
    return {
      status: 'success' as const,
      responseTime: 150,
      error: null,
    }
  }
}

// Export repositories
export const users = new UserRepository()
export const organizations = new OrganizationRepository()
export const hosts = new HostRepository()