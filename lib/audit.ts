import { auditLogs } from './db/schema'
import { db } from './db'
import { eq, desc } from 'drizzle-orm'

export interface AuditLogData {
  userId?: string
  organizationId?: string
  action: string
  resource?: string
  resourceId?: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
}

export async function logAudit(data: AuditLogData) {
  try {
    await db.insert(auditLogs).values({
      userId: data.userId,
      organizationId: data.organizationId,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    })
  } catch (error) {
    console.error('Failed to log audit event:', error)
    // Don't throw to avoid breaking the main flow
  }
}

export async function getAuditLogs(organizationId?: string, limit = 100) {
  try {
    if (organizationId) {
      return await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.organizationId, organizationId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
    }

    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    return []
  }
}
