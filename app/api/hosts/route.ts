import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { organizations, organizationMembers, hosts } from '@/lib/db/schema'
import { eq, and, or, desc, in as inOperator } from 'drizzle-orm'
import { encryptCredentials } from '@/lib/encryption'
import { z } from 'zod'

const createHostSchema = z.object({
  organizationId: z.string(),
  name: z.string().min(1).max(100),
  host: z.string().min(1),
  port: z.number().min(1).max(65535).optional().default(9000),
  username: z.string().optional(),
  password: z.string().optional(),
  description: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const organizationId = url.searchParams.get('organizationId')

    let query = db
      .select({
        id: hosts.id,
        organizationId: hosts.organizationId,
        name: hosts.name,
        host: hosts.host,
        port: hosts.port,
        username: hosts.username,
        description: hosts.description,
        isActive: hosts.isActive,
        createdAt: hosts.createdAt,
        updatedAt: hosts.updatedAt,
        organization: {
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
        },
      })
      .from(hosts)
      .leftJoin(organizations, eq(organizations.id, hosts.organizationId))

    if (organizationId) {
      // Check if user has access to this organization
      const membership = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, session.user.id)
        ),
      })

      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      query = query.where(eq(hosts.organizationId, organizationId))
    } else {
      // Get hosts from all organizations the user belongs to
      const userOrgs = await db.query.organizationMembers.findMany({
        where: eq(organizationMembers.userId, session.user.id),
        columns: { organizationId: true },
      })

      const orgIds = userOrgs.map((m) => m.organizationId)

      if (orgIds.length === 0) {
        return NextResponse.json([])
      }

      query = query.where(inOperator(hosts.organizationId, orgIds))
    }

    const result = await query.orderBy(desc(hosts.createdAt))
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching hosts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createHostSchema.parse(body)

    // Check if user has access to the organization
    const membership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, validatedData.organizationId),
        eq(organizationMembers.userId, session.user.id)
      ),
    })

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Encrypt credentials if provided
    let encryptedCredentials: string | undefined
    if (validatedData.username || validatedData.password) {
      const credentials = {
        username: validatedData.username,
        password: validatedData.password,
      }
      encryptedCredentials = encryptCredentials(
        credentials,
        process.env.ENCRYPTION_KEY!
      )
    }

    const [newHost] = await db
      .insert(hosts)
      .values({
        organizationId: validatedData.organizationId,
        name: validatedData.name,
        host: validatedData.host,
        port: validatedData.port,
        username: validatedData.username,
        encryptedCredentials,
        description: validatedData.description,
      })
      .returning()

    return NextResponse.json(newHost, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating host:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
