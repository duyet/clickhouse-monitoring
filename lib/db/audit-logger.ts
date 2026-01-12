import { auditLogs } from './schema'
import type { NewAuditLog } from './schema'
import { db } from './index'

export class AuditLogger {
  async logAction(
    data: Omit<NewAuditLog, 'createdAt'> & { createdAt?: Date }
  ): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        ...data,
        createdAt: data.createdAt || new Date(),
      })
    } catch (error) {
      console.error('Failed to log audit event:', error)
      // Don't throw - audit logging should not break the application
    }
  }

  async logUserAction(
    userId: number,
    action: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    status: 'success' | 'failed' | 'pending' = 'success'
  ): Promise<void> {
    await this.logAction({
      userId,
      action,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ipAddress,
      userAgent,
      status,
    })
  }

  async logOrganizationAction(
    userId: number,
    organizationId: number,
    action: string,
    resource?: string,
    resourceId?: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    status: 'success' | 'failed' | 'pending' = 'success'
  ): Promise<void> {
    await this.logAction({
      userId,
      organizationId,
      action,
      resource,
      resourceId,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ipAddress,
      userAgent,
      status,
    })
  }

  async logHostAction(
    userId: number,
    organizationId: number,
    action: string,
    hostId: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    status: 'success' | 'failed' | 'pending' = 'success'
  ): Promise<void> {
    await this.logAction({
      userId,
      organizationId,
      action,
      resource: 'host',
      resourceId: hostId,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ipAddress,
      userAgent,
      status,
    })
  }

  async logAuthAction(
    userId: number,
    action: 'login' | 'logout' | 'failed_login',
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>,
    status: 'success' | 'failed' = action === 'failed_login' ? 'failed' : 'success'
  ): Promise<void> {
    await this.logAction({
      userId,
      action,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ipAddress,
      userAgent,
      status,
    })
  }

  // Helper to get user from request (when available)
  static getUserFromRequest(request: Request): { id: number; email: string } | null {
    // This would extract user from the request when auth middleware is implemented
    // For now, return null
    return null
  }

  // Helper to get IP address from request
  static getIpAddress(request: Request): string {
    return (
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'
    )
  }

  // Helper to get user agent from request
  static getUserAgent(request: Request): string {
    return request.headers.get('user-agent') || 'unknown'
  }
}

// Global audit logger instance
export const auditLogger = new AuditLogger()