import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { organizations, organizationMembers } from '@/lib/db/schema'
import { eq, and, or, desc, exists } from 'drizzle-orm'
import { z } from 'zod'

const createOrganizationSchema = z.object({
  name: z.string().min(1).max(100),
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

    const organizationsWithMembers = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        description: organizations.description,
        createdAt: organizations.createdAt,
        memberCount: db.$count(
          organizationMembers,
          eq(organizationMembers.organizationId, organizations.id)
        ),
        userRole: db
          .select({ role: organizationMembers.role })
          .from(organizationMembers)
          .where(
            and(
              eq(organizationMembers.organizationId, organizations.id),
              eq(organizationMembers.userId, session.user.id)
            )
          )
          .limit(1),
      })
      .from(organizations)
      .leftJoin(
        organizationMembers,
        eq(organizationMembers.organizationId, organizations.id)
      )
      .where(
        or(
          exists(
            db
              .select()
              .from(organizationMembers)
              .where(
                and(
                  eq(organizationMembers.organizationId, organizations.id),
                  eq(organizationMembers.userId, session.user.id)
                )
              )
          )
        )
      )
      .orderBy(desc(organizations.createdAt))

    return NextResponse.json(organizationsWithMembers)
  } catch (error) {
    console.error('Error fetching organizations:', error)
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
    const validatedData = createOrganizationSchema.parse(body)

    // Generate a unique slug
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if slug already exists
    const existingOrg = await db.query.organizations.findFirst({
      where: eq(organizations.slug, slug),
    })

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization with this name already exists' },
        { status: 400 }
      )
    }

    // Create organization
    const [newOrg] = await db
      .insert(organizations)
      .values({
        name: validatedData.name,
        slug,
        description: validatedData.description,
      })
      .returning()

    // Add creator as owner
    await db.insert(organizationMembers).values({
      organizationId: newOrg.id,
      userId: session.user.id,
      role: 'owner',
    })

    return NextResponse.json(newOrg, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating organization:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
