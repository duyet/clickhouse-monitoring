import { db } from "./db"
import { auditLogs } from "./db/schema"
import { auth } from "./auth/config"
import { eq } from "drizzle-orm"

export interface AuditLogOptions {
  userId?: string
  organizationId?: string
  action: string
  resource?: string
  resourceId?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export async function auditLog(options: AuditLogOptions) {
  try {
    const session = await auth.api.getSession()

    const logData = {
      userId: options.userId || session?.user?.id || null,
      organizationId: options.organizationId,
      action: options.action,
      resource: options.resource,
      resourceId: options.resourceId,
      metadata: options.metadata ? JSON.stringify(options.metadata) : null,
      ipAddress: options.ipAddress || null,
      userAgent: options.userAgent || null,
    }

    await db.insert(auditLogs).values(logData)
  } catch (error) {
    console.error("Failed to create audit log:", error)
    // Don't throw - audit logging should not fail the main operation
  }
}

// Helper functions for common audit events
export const auditEvents = {
  auth: {
    login: (userId: string, metadata?: { ipAddress?: string; userAgent?: string }) =>
      auditLog({ userId, action: "auth.login", metadata }),
    logout: (userId: string) =>
      auditLog({ userId, action: "auth.logout" }),
    register: (userId: string, email: string) =>
      auditLog({ userId, action: "auth.register", metadata: { email } }),
    failedLogin: (email: string, metadata?: { ipAddress?: string; userAgent?: string }) =>
      auditLog({ action: "auth.failed_login", metadata: { email, ...metadata } }),
    passwordReset: (userId: string, email: string) =>
      auditLog({ userId, action: "auth.password_reset", metadata: { email } }),
  },
  organization: {
    create: (userId: string, organizationId: string, name: string) =>
      auditLog({ userId, organizationId, action: "organization.create", resource: "organization", resourceId: organizationId, metadata: { name } }),
    update: (userId: string, organizationId: string, changes: Record<string, any>) =>
      auditLog({ userId, organizationId, action: "organization.update", resource: "organization", resourceId: organizationId, metadata: changes }),
    delete: (userId: string, organizationId: string, name: string) =>
      auditLog({ userId, organizationId, action: "organization.delete", resource: "organization", resourceId: organizationId, metadata: { name } }),
    memberAdd: (userId: string, organizationId: string, memberEmail: string, role: string) =>
      auditLog({ userId, organizationId, action: "organization.member_add", resource: "organization_member", metadata: { memberEmail, role } }),
    memberRemove: (userId: string, organizationId: string, memberEmail: string) =>
      auditLog({ userId, organizationId, action: "organization.member_remove", resource: "organization_member", metadata: { memberEmail } }),
    memberRoleUpdate: (userId: string, organizationId: string, memberEmail: string, oldRole: string, newRole: string) =>
      auditLog({ userId, organizationId, action: "organization.member_role_update", resource: "organization_member", metadata: { memberEmail, oldRole, newRole } }),
  },
  host: {
    create: (userId: string, organizationId: string, name: string, host: string) =>
      auditLog({ userId, organizationId, action: "host.create", resource: "host", metadata: { name, host } }),
    update: (userId: string, organizationId: string, hostId: string, changes: Record<string, any>) =>
      auditLog({ userId, organizationId, action: "host.update", resource: "host", resourceId: hostId, metadata: changes }),
    delete: (userId: string, organizationId: string, name: string, host: string) =>
      auditLog({ userId, organizationId, action: "host.delete", resource: "host", metadata: { name, host } }),
    testConnection: (userId: string, organizationId: string, hostId: string, success: boolean) =>
      auditLog({ userId, organizationId, action: "host.test_connection", resource: "host", resourceId: hostId, metadata: { success } }),
  },
  user: {
    profileUpdate: (userId: string, changes: Record<string, any>) =>
      auditLog({ userId, action: "user.profile_update", metadata: changes }),
    settingsUpdate: (userId: string, changes: Record<string, any>) =>
      auditLog({ userId, action: "user.settings_update", metadata: changes }),
  },
}

// Function to get audit logs
export async function getAuditLogs(options: {
  userId?: string
  organizationId?: string
  action?: string
  resource?: string
  limit?: number
  offset?: number
}) {
  const { userId, organizationId, action, resource, limit = 50, offset = 0 } = options

  let query = db.select().from(auditLogs)

  if (userId) {
    query = query.where(eq(auditLogs.userId, userId))
  }

  if (organizationId) {
    query = query.where(eq(auditLogs.organizationId, organizationId))
  }

  if (action) {
    query = query.where(ilike(auditLogs.action, `%${action}%`))
  }

  if (resource) {
    query = query.where(eq(auditLogs.resource, resource))
  }

  const logs = await query
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset)

  return logs
}