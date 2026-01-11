/**
 * Host management API routes
 * Secure CRUD operations for ClickHouse hosts with encryption at rest
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { encryptHostCredentials } from '@/lib/encryption'
import { auth } from '@/lib/auth/config'
import { schema } from '@/lib/db/schema'
import { createConnection } from '@/lib/clickhouse'

// GET /api/hosts - List hosts for organization
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      )
    }

    // Check permission
    const canView = await db.isOrganizationMember(session.user.id, organizationId)
    if (!canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch hosts
    const hosts = await db.findActiveHostsByOrganization(organizationId)

    // Return hosts without sensitive data
    const sanitizedHosts = hosts.map(host => ({
      id: host.id,
      name: host.name,
      description: host.description,
      host: host.host, // Note: this is encrypted, client decrypts if needed
      port: host.port,
      username: host.username, // Note: this is encrypted
      protocol: host.protocol,
      secure: host.secure,
      isActive: host.isActive,
      lastConnectedAt: host.lastConnectedAt,
      connectionError: host.connectionError,
      clickhouseVersion: host.clickhouseVersion,
      clusterName: host.clusterName,
      createdAt: host.createdAt,
      updatedAt: host.updatedAt,
      createdBy: host.createdBy,
    }))

    return NextResponse.json({
      success: true,
      data: sanitizedHosts,
    })
  } catch (error) {
    console.error('Failed to fetch hosts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/hosts - Create new host
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      organizationId,
      name,
      description,
      host,
      port,
      username,
      password,
      protocol = 'http',
      secure = false,
      skipVerify = false,
      testConnection = false, // If true, test connection before saving
    } = await request.json()

    // Validate required fields
    if (!organizationId || !name || !host || !username || !password) {
      return NextResponse.json(
        { error: 'organizationId, name, host, username, and password are required' },
        { status: 400 }
      )
    }

    // Check permission
    const hasPermission = await db.hasPermission(session.user.id, organizationId, 'write')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Test connection if requested
    if (testConnection) {
      try {
        const client = createConnection({
          host,
          port,
          username,
          password,
          protocol: protocol === 'https' ? 'https' : 'http',
          secure,
        })
        // This will throw if connection fails
        await client.ping()
      } catch (connectionError) {
        return NextResponse.json(
          {
            error: 'Connection failed',
            details: connectionError instanceof Error ? connectionError.message : String(connectionError),
          },
          { status: 400 }
        )
      }
    }

    // Encrypt credentials before storage
    const encrypted = encryptHostCredentials({ host, username, password })

    // Create host record
    const newHost = await db.dbInstance.insert(schema.hosts).values({
      organizationId,
      name,
      description,
      host: encrypted.host,
      port,
      username: encrypted.username,
      password: encrypted.password,
      protocol,
      secure,
      skipVerify,
      createdBy: session.user.id,
    }).returning().get()

    // Log audit event
    await db.logAuditEvent({
      userId: session.user.id,
      organizationId,
      action: 'host.create',
      resourceType: 'host',
      resourceId: newHost.id,
      success: true,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        name,
        host,
        port,
        protocol,
      },
    })

    // Return sanitized host
    const sanitizedHost = {
      ...newHost,
      password: '***', // Don't return encrypted password
    }

    return NextResponse.json({
      success: true,
      data: sanitizedHost,
    })
  } catch (error) {
    console.error('Failed to create host:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/hosts/:id - Delete host
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const hostId = searchParams.get('id')

    if (!hostId) {
      return NextResponse.json(
        { error: 'hostId is required' },
        { status: 400 }
      )
    }

    // Find host
    const host = await db.dbInstance.query.hosts.findFirst({
      where: (hosts, { eq }) => eq(hosts.id, hostId),
    })

    if (!host) {
      return NextResponse.json(
        { error: 'Host not found' },
        { status: 404 }
      )
    }

    // Check permission
    const hasPermission = await db.hasPermission(session.user.id, host.organizationId, 'write')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete host
    await db.dbInstance.delete(schema.hosts).where((hosts, { eq }) => eq(hosts.id, hostId))

    // Log audit event
    await db.logAuditEvent({
      userId: session.user.id,
      organizationId: host.organizationId,
      action: 'host.delete',
      resourceType: 'host',
      resourceId: hostId,
      success: true,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        name: host.name,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Host deleted successfully',
    })
  } catch (error) {
    console.error('Failed to delete host:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Test connection endpoint
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { host, port, username, password, protocol, secure } = await request.json()

    if (!host || !username || !password) {
      return NextResponse.json(
        { error: 'host, username, and password are required' },
        { status: 400 }
      )
    }

    // Test connection
    try {
      const client = createConnection({
        host,
        port: port || 9000,
        username,
        password,
        protocol: protocol || 'http',
        secure: secure || false,
      })
      await client.ping()

      return NextResponse.json({
        success: true,
        message: 'Connection successful',
      })
    } catch (connectionError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Connection failed',
          details: connectionError instanceof Error ? connectionError.message : String(connectionError),
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Failed to test connection:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}