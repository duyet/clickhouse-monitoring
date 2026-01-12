import { auth } from "@/lib/auth/config"
import { createErrorResponse, createSuccessResponse } from "@/lib/api/error-handler"
import { ApiErrorType } from "@/lib/api/types"
import { db } from "@/lib/db"
import { organizations, organizationMembers } from "@/lib/db/schema"
import { auditLog } from "@/lib/audit"
import { eq, and, or, ilike, desc } from "drizzle-orm"
import { generateSecureToken } from "@/lib/encryption"

export const dynamic = "force-dynamic"

// GET /api/organizations - List user's organizations
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

    // Get organizations where user is a member
    const userMemberships = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, session.user.id))

    const orgIds = userMemberships.map(m => m.organizationId)

    const orgs = await db
      .select()
      .from(organizations)
      .where(or(
        eq(organizations.id, orgIds[0]), // Simplified for now
        eq(organizations.id, orgIds[1]),
        // ... add more as needed
      ))
      .orderBy(desc(organizations.createdAt))

    // Add user role to each organization
    const organizationsWithRole = orgs.map(org => {
      const membership = userMemberships.find(m => m.organizationId === org.id)
      return {
        ...org,
        userRole: membership?.role || "member",
      }
    })

    return createSuccessResponse(organizationsWithRole)
  } catch (error) {
    console.error("Error fetching organizations:", error)
    return createErrorResponse(
      {
        type: ApiErrorType.InternalError,
        message: "Failed to fetch organizations",
      },
      500
    )
  }
}

// POST /api/organizations - Create new organization
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
    const { name, description } = body

    if (!name?.trim()) {
      return createErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: "Organization name is required",
        },
        400
      )
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

    // Check if slug already exists
    const existingOrg = await db.query.organizations.findFirst({
      where: eq(organizations.slug, slug),
    })

    if (existingOrg) {
      return createErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: "Organization name already taken",
        },
        400
      )
    }

    // Create organization
    const newOrg = await db.insert(organizations).values({
      name: name.trim(),
      slug,
      description: description?.trim() || null,
    }).returning()

    // Add user as owner
    await db.insert(organizationMembers).values({
      organizationId: newOrg[0].id,
      userId: session.user.id,
      role: "owner",
    })

    // Log the action
    await auditLog({
      userId: session.user.id,
      action: "organization.create",
      resource: "organization",
      resourceId: newOrg[0].id,
      metadata: { name: newOrg[0].name },
    })

    return createSuccessResponse(newOrg[0], 201)
  } catch (error) {
    console.error("Error creating organization:", error)
    return createErrorResponse(
      {
        type: ApiErrorType.InternalError,
        message: "Failed to create organization",
      },
      500
    )
  }
}