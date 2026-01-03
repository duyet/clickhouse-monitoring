import { type NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/clickhouse'
import { getHostIdFromParams } from '@/lib/api/error-handler'
import { ErrorLogger } from '@/lib/logger'
import { initTrackingTable } from '@/lib/tracking'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
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
