/**
 * Audit Log repository - Data access layer for audit trail operations
 */

import type { AuditLog, NewAuditLog } from '@/lib/db/schema'

import { and, desc, eq, gte, lt } from 'drizzle-orm'
import { auditLog } from '@/lib/db/schema'
import { generateAuditId } from '@/lib/db/utils'

// Generic database type that works with both SQLite and Postgres adapters
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDatabase = any

export class AuditLogRepository {
  constructor(private db: DrizzleDatabase) {}

  /**
   * Create audit log entry
   */
  async create(data: Omit<NewAuditLog, 'id'>): Promise<AuditLog> {
    const id = generateAuditId()
    const logData = { id, ...data } as NewAuditLog

    await this.db.insert(auditLog).values(logData)

    return this.getById(id) as Promise<AuditLog>
  }

  /**
   * Get log entry by ID
   */
  async getById(id: string): Promise<AuditLog | null> {
    const result = await this.db
      .select()
      .from(auditLog)
      .where(eq(auditLog.id, id))
      .limit(1)

    return result[0] || null
  }

  /**
   * Get audit logs for organization
   */
  async getByOrganization(
    orgId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLog[]> {
    return this.db
      .select()
      .from(auditLog)
      .where(eq(auditLog.organizationId, orgId))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset)
  }

  /**
   * Get audit logs for user
   */
  async getByUser(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLog[]> {
    return this.db
      .select()
      .from(auditLog)
      .where(eq(auditLog.userId, userId))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset)
  }

  /**
   * Get audit logs for organization and user
   */
  async getByOrgAndUser(
    orgId: string,
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLog[]> {
    return this.db
      .select()
      .from(auditLog)
      .where(
        and(eq(auditLog.organizationId, orgId), eq(auditLog.userId, userId))
      )
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset)
  }

  /**
   * Get audit logs for resource
   */
  async getByResource(
    resourceType: string,
    resourceId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLog[]> {
    return this.db
      .select()
      .from(auditLog)
      .where(
        and(
          eq(auditLog.resourceType, resourceType),
          eq(auditLog.resourceId, resourceId)
        )
      )
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset)
  }

  /**
   * Get recent logs for organization within a time window
   */
  async getRecentForOrganization(
    orgId: string,
    hoursBack: number = 24,
    limit: number = 100
  ): Promise<AuditLog[]> {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000)

    return this.db
      .select()
      .from(auditLog)
      .where(
        and(eq(auditLog.organizationId, orgId), gte(auditLog.createdAt, since))
      )
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
  }

  /**
   * Delete logs older than specified days
   * Returns the number of deleted records
   */
  async deleteOlderThan(days: number): Promise<number> {
    const before = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const result = await this.db
      .delete(auditLog)
      .where(lt(auditLog.createdAt, before))

    // Drizzle returns different structures depending on adapter
    // For SQLite: { changes: number }
    // For Postgres: { rowCount: number }
    return (
      (result as { changes?: number }).changes ??
      (result as { rowCount?: number }).rowCount ??
      0
    )
  }
}
