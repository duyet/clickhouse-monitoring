import { ErrorLogger } from '@chm/logger'
import { NextResponse } from 'next/server'
import { getHostIdFromParams } from '@/lib/api/error-handler'
import { getClient } from '@/lib/clickhouse'
import { ACTIONS_FEATURE_PERMISSION } from '@/lib/feature-permissions/permissions'
import { authorizeFeatureRequest } from '@/lib/feature-permissions/server'
import { initTrackingTable } from '@/lib/tracking'

export const dynamic = 'force-dynamic'

async function handleInit(request: Request) {
  const searchParams = new URL(request.url).searchParams
  let hostId: number

  try {
    const parsedHostId = getHostIdFromParams(searchParams, {
      route: '/api/init',
    })
    hostId =
      typeof parsedHostId === 'string'
        ? parseInt(parsedHostId, 10)
        : parsedHostId
  } catch {
    return NextResponse.json(
      { error: 'Missing required parameter: hostId' },
      { status: 400 }
    )
  }

  const permissionResponse = await authorizeFeatureRequest(
    ACTIONS_FEATURE_PERMISSION,
    request
  )
  if (permissionResponse) return permissionResponse

  // getClient will auto-detect and use web client for Cloudflare Workers
  const client = await getClient({ hostId })

  try {
    await initTrackingTable(client)
    return NextResponse.json({
      message: 'Ok.',
    })
  } catch (error) {
    ErrorLogger.logError(
      error instanceof Error ? error : new Error(String(error)),
      { route: '/api/init' }
    )

    return NextResponse.json(
      {
        error: `${error}`,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  return handleInit(request)
}
