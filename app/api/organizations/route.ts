/**
 * Organization management API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { encryptHostCredentials } from '@/lib/encryption'
import { auth } from '@/lib/auth/config'
import { schema } from '@/lib/db/schema'

// GET /api/organizations - List user's organizations
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizations = await db.getUserOrganizations(session.user.id)

    return NextResponse.json({
      success: true,
      data: organizations,
    })
  } catch (error) {
    console.error('Failed to fetch organizations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/organizations - Create new organization
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, slug } = await request.json()

    // Validate input
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Check if slug is unique
    const existingOrg = await db.dbInstance.query.organizations.findFirst({
      where: (organizations, { eq }) => eq(organizations.slug, slug),
    })

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization slug already exists' },
        { status: 409 }
      )
    }

    // Create organization
    const newOrg = await db.dbInstance.insert(schema.organizations).values({
      name,
      slug,
      description,
      createdBy: session.user.id,
    }).returning().get()

    // Add creator as owner
    await db.dbInstance.insert(schema.organizationMembers).values({
      organizationId: newOrg.id,
      userId: session.user.id,
      role: 'owner',
    })

    // Log audit event
    await db.logAuditEvent({
      userId: session.user.id,
      organizationId: newOrg.id,
      action: 'organization.create',
      resourceType: 'organization',
      resourceId: newOrg.id,
      success: true,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        name,
        slug,
      },
    })

    return NextResponse.json({
      success: true,
      data: newOrg,
    })
  } catch (error) {
    console.error('Failed to create organization:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}