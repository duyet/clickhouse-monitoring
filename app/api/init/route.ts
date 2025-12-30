import { type NextRequest, NextResponse } from 'next/server'

import { getClient } from '@/lib/clickhouse'
import { ErrorLogger } from '@/lib/logger'
import { getHostIdCookie } from '@/lib/scoped-link'
import { initTrackingTable } from '@/lib/tracking'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const hostId = searchParams.get('hostId')
    ? parseInt(searchParams.get('hostId')!, 10)
    : await getHostIdCookie()

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
