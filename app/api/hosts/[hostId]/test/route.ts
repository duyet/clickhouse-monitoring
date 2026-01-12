import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { hosts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { decryptCredentials } from '@/lib/encryption'
import { createClient } from '@clickhouse/client'

export async function POST(
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

    // Get host details
    const host = await db.query.hosts.findFirst({
      where: eq(hosts.id, params.hostId),
      with: {
        organization: true,
      },
    })

    if (!host) {
      return NextResponse.json({ error: 'Host not found' }, { status: 404 })
    }

    // Check if user has access to this organization
    const membership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, host.organizationId),
        eq(organizationMembers.userId, session.user.id)
      ),
    })

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prepare connection parameters
    let clickhouseUsername = host.username
    let clickhousePassword

    if (host.encryptedCredentials) {
      const credentials = decryptCredentials(
        host.encryptedCredentials,
        process.env.ENCRYPTION_KEY!
      )
      if (credentials) {
        clickhouseUsername = credentials.username || clickhouseUsername
        clickhousePassword = credentials.password
      }
    }

    const clickhouseClient = createClient({
      host: host.host,
      port: host.port || 9000,
      username: clickhouseUsername,
      password: clickhousePassword,
      // Short timeout for testing
      request_timeout: 5000,
    })

    try {
      // Test connection with a simple query
      const result = await clickhouseClient.query({
        query: 'SELECT 1 as test',
        format: 'JSONEachRow',
      })

      const rows = await result.json()
      await clickhouseClient.close()

      return NextResponse.json({
        success: true,
        message: 'Connection successful',
        data: rows,
      })
    } catch (error) {
      await clickhouseClient.close()

      return NextResponse.json(
        {
          success: false,
          message: 'Connection failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error testing host:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
