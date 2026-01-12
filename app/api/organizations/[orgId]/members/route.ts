import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { organizations, organizationMembers, users } from '@/lib/db/schema'
import { eq, and, or, desc } from 'drizzle-orm'
import { z } from 'zod'

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'member']).default('member'),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to view members
    const userMembership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, params.orgId),
        eq(organizationMembers.userId, session.user.id)
      ),
    })

    if (
      !userMembership ||
      (userMembership.role !== 'owner' && userMembership.role !== 'admin')
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const members = await db
      .select({
        id: organizationMembers.id,
        userId: organizationMembers.userId,
        role: organizationMembers.role,
        joinedAt: organizationMembers.joinedAt,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
          image: users.image,
        },
      })
      .from(organizationMembers)
      .leftJoin(users, eq(users.id, organizationMembers.userId))
      .where(eq(organizationMembers.organizationId, params.orgId))
      .orderBy(desc(organizationMembers.joinedAt))

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to invite members
    const userMembership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, params.orgId),
        eq(organizationMembers.userId, session.user.id)
      ),
    })

    if (!userMembership || userMembership.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = inviteMemberSchema.parse(body)

    // Check if organization exists
    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, params.orgId),
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, validatedData.email),
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is already a member
    const existingMembership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, params.orgId),
        eq(organizationMembers.userId, existingUser.id)
      ),
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 400 }
      )
    }

    // Add member to organization
    const [newMember] = await db
      .insert(organizationMembers)
      .values({
        organizationId: params.orgId,
        userId: existingUser.id,
        role: validatedData.role,
      })
      .returning()

    return NextResponse.json(newMember, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error inviting member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
