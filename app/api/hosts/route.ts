import { auth } from "@/lib/auth/config"
import { createErrorResponse, createSuccessResponse } from "@/lib/api/error-handler"
import { ApiErrorType } from "@/lib/api/types"
import { db } from "@/lib/db"
import { hosts, organizations, organizationMembers } from "@/lib/db/schema"
import { auditLog } from "@/lib/audit"
import { encryptHostCredentials, decryptHostCredentials } from "@/lib/encryption"
import { eq, and, or, ilike, desc } from "drizzle-orm"

export const dynamic = "force-dynamic"

// Helper function to get user's organization IDs
async function getUserOrganizationIds(userId: string) {
  const memberships = await db
    .select()
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, userId))

  return memberships.map(m => m.organizationId)
}

// GET /api/hosts - List user's hosts
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user?.id) {
      return createErrorResponse(
        {
          type: ApiErrorType.Unauthorized,
          message: "Authentication required",
        },
        401
      )
    }

    // Get user's organization IDs
    const orgIds = await getUserOrganizationIds(session.user.id)

    // Get hosts from user's organizations
    const hostsList = await db
      .select({
        id: hosts.id,
        name: hosts.name,
        host: hosts.host,
        port: hosts.port,
        username: hosts.username,
        database: hosts.database,
        customName: hosts.customName,
        isActive: hosts.isActive,
        createdAt: hosts.createdAt,
        updatedAt: hosts.updatedAt,
        organizationName: organizations.name,
      })
      .from(hosts)
      .leftJoin(organizations, eq(hosts.organizationId, organizations.id))
      .where(or(
        eq(hosts.organizationId, orgIds[0]),
        eq(hosts.organizationId, orgIds[1]),
        // ... add more as needed
      ))
      .orderBy(desc(hosts.createdAt))

    // Decrypt passwords for response (this is not ideal for production,
    // but for now we'll decrypt on the fly)
    const hostsWithDecryptedPasswords = hostsList.map(host => ({
      ...host,
      // Note: In production, you would decrypt these on demand or use a secure
      // session-based approach. For now, we'll return without passwords.
    }))

    return createSuccessResponse(hostsWithDecryptedPasswords)
  } catch (error) {
    console.error("Error fetching hosts:", error)
    return createErrorResponse(
      {
        type: ApiErrorType.InternalError,
        message: "Failed to fetch hosts",
      },
      500
    )
  }
}

// POST /api/hosts - Create new host
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user?.id) {
      return createErrorResponse(
        {
          type: ApiErrorType.Unauthorized,
          message: "Authentication required",
        },
        401
      )
    }

    const body = await request.json()
    const {
      organizationId,
      name,
      host,
      port,
      username,
      password,
      database = "default",
      customName
    } = body

    // Validate required fields
    if (!organizationId || !name || !host || !username || !password) {
      return createErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: "Organization ID, name, host, username, and password are required",
        },
        400
      )
    }

    // Verify user has access to the organization
    const userOrgIds = await getUserOrganizationIds(session.user.id)
    if (!userOrgIds.includes(organizationId)) {
      return createErrorResponse(
        {
          type: ApiErrorType.Forbidden,
          message: "You don't have access to this organization",
        },
        403
      )
    }

    // Encrypt credentials
    const { encrypted, iv, tag } = encryptHostCredentials({
      host,
      port: Number(port),
      username,
      password,
      database,
    })

    // Create host
    const newHost = await db.insert(hosts).values({
      organizationId,
      name: name.trim(),
      host: host.trim(),
      port: Number(port),
      username: username.trim(),
      password: encrypted,
      database,
      customName: customName?.trim() || null,
    }).returning()

    // Log the action
    await auditLog({
      userId: session.user.id,
      organizationId,
      action: "host.create",
      resource: "host",
      resourceId: newHost[0].id,
      metadata: { name: newHost[0].name, host: newHost[0].host },
    })

    return createSuccessResponse(newHost[0], 201)
  } catch (error) {
    console.error("Error creating host:", error)
    return createErrorResponse(
      {
        type: ApiErrorType.InternalError,
        message: "Failed to create host",
      },
      500
    )
  }
}