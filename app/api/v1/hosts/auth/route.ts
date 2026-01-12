import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/utils'
import { db, schema, encryptHostPassword } from '@/lib/db'
import { auditLogger } from '@/lib/db/audit-logger'
import { eq, in } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    // Get user's organizations
    const userOrgs = await db
      .select()
      .from(schema.organizationMembers)
      .where(eq(schema.organizationMembers.userId, session.user.id))

    const organizationIds = userOrgs.map(org => org.organizationId)

    // Get hosts from user's organizations
    const hosts = await db
      .select()
      .from(schema.hosts)
      .where(in(schema.hosts.organizationId, organizationIds))

    return NextResponse.json({
      hosts,
    })
  } catch (error) {
    console.error('Failed to fetch hosts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hosts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    // Validate input
    if (!body.name || !body.host) {
      return NextResponse.json(
        { error: 'Host name and address are required' },
        { status: 400 }
      )
    }

    // Get user's first organization (for now)
    const userOrgs = await db
      .select()
      .from(schema.organizationMembers)
      .where(eq(schema.organizationMembers.userId, session.user.id))

    if (userOrgs.length === 0) {
      return NextResponse.json(
        { error: 'You must be a member of an organization to add hosts' },
        { status: 400 }
      )
    }

    const organizationId = userOrgs[0].organizationId

    // Encrypt password if provided
    const encryptedPassword = body.password ? encryptHostPassword(body.password) : null

    // Create host
    const newHost = await db
      .insert(schema.hosts)
      .values({
        organizationId,
        name: body.name,
        host: body.host,
        port: body.port || 9000,
        username: body.username || null,
        encryptedPassword,
        database: body.database || null,
        description: body.description || null,
      })
      .returning()
      .then(rows => rows[0])

    // Log audit event
    await auditLogger.logHostAction(
      session.user.id,
      organizationId,
      'create_host',
      newHost.id.toString(),
      { name: body.name, host: body.host, port: body.port }
    )

    return NextResponse.json(newHost, { status: 201 })
  } catch (error) {
    console.error('Failed to create host:', error)
    return NextResponse.json(
      { error: 'Failed to create host' },
      { status: 500 }
    )
  }
}