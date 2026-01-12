import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/utils'
import { db, schema } from '@/lib/db'
import { auditLogger } from '@/lib/db/audit-logger'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const userOrgs = await db
      .select()
      .from(schema.organizationMembers)
      .leftJoin(schema.organizations, eq(schema.organizationMembers.organizationId, schema.organizations.id))
      .where(eq(schema.organizationMembers.userId, session.user.id))

    return NextResponse.json({
      organizations: userOrgs.map(row => ({
        ...row.organizations,
        role: row.organization_members.role,
      })),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    // Validate input
    if (!body.name) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      )
    }

    // Create organization
    const newOrg = await db
      .insert(schema.organizations)
      .values({
        name: body.name,
        slug: body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
        description: body.description || null,
      })
      .returning()
      .then(rows => rows[0])

    // Add creator as owner
    await db.insert(schema.organizationMembers).values({
      organizationId: newOrg.id,
      userId: session.user.id,
      role: 'owner',
    })

    // Log audit event
    await auditLogger.logOrganizationAction(
      session.user.id,
      newOrg.id,
      'create_organization',
      'organization',
      newOrg.id.toString(),
      { name: body.name, description: body.description }
    )

    return NextResponse.json(newOrg, { status: 201 })
  } catch (error) {
    console.error('Failed to create organization:', error)
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
}