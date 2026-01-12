import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { organizationMembers, hosts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { encryptCredentials } from '@/lib/encryption'
import { z } from 'zod'

const updateHostSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  host: z.string().min(1).optional(),
  port: z.number().min(1).max(65535).optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

async function checkHostAccess(userId: string, hostId: string) {
  const host = await db.query.hosts.findFirst({
    where: eq(hosts.id, hostId),
  })

  if (!host) return { access: false, host: null }

  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.organizationId, host.organizationId),
      eq(organizationMembers.userId, userId)
    ),
  })

  return {
    access: !!membership,
    host,
    isOwner: membership?.role === 'owner',
    isAdmin: membership?.role === 'admin',
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { hostId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { access, host } = await checkHostAccess(
      session.user.id,
      params.hostId
    )

    if (!access || !host) {
      return NextResponse.json(
        { error: 'Host not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json(host)
  } catch (error) {
    console.error('Error fetching host:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { hostId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { access, isOwner, isAdmin } = await checkHostAccess(
      session.user.id,
      params.hostId
    )

    if (!access) {
      return NextResponse.json(
        { error: 'Host not found or access denied' },
        { status: 404 }
      )
    }

    // Only owners and admins can edit hosts
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateHostSchema.parse(body)

    // Update data
    const updateData: any = {
      name: validatedData.name,
      host: validatedData.host,
      port: validatedData.port,
      username: validatedData.username,
      description: validatedData.description,
      isActive: validatedData.isActive,
    }

    // Encrypt credentials if password provided
    if (validatedData.password) {
      const credentials = {
        username: validatedData.username,
        password: validatedData.password,
      }
      updateData.encryptedCredentials = encryptCredentials(
        credentials,
        process.env.ENCRYPTION_KEY!
      )
    }

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    const [updatedHost] = await db
      .update(hosts)
      .set(updateData)
      .where(eq(hosts.id, params.hostId))
      .returning()

    return NextResponse.json(updatedHost)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating host:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { hostId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { access, isOwner } = await checkHostAccess(
      session.user.id,
      params.hostId
    )

    if (!access) {
      return NextResponse.json(
        { error: 'Host not found or access denied' },
        { status: 404 }
      )
    }

    // Only owners can delete hosts
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.delete(hosts).where(eq(hosts.id, params.hostId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting host:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
