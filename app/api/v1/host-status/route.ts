import { type NextRequest, NextResponse } from 'next/server'
import { fetchData } from '@/lib/clickhouse'
import { QUERY_COMMENT } from '@/lib/clickhouse/constants'
import { debug } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/host-status?hostId=0
 *
 * Returns host status information (version, uptime, hostname) in a single request.
 * This endpoint consolidates three separate chart calls into one for efficiency.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const hostIdParam = searchParams.get('hostId')
  const hostId = hostIdParam ? parseInt(hostIdParam, 10) : 0

  try {
    // Single query to fetch all values
    const result = await fetchData<
      Array<{ version: string; uptime: string; hostname: string }>
    >({
      query: `
        SELECT
          version() as version,
          formatReadableTimeDelta(uptime()) as uptime,
          hostName() as hostname
        ${QUERY_COMMENT}
      `,
      hostId,
      format: 'JSONEachRow',
    })

    debug('[host-status] FetchData result:', result)

    const data = result.data?.[0]
    const version = data?.version ?? ''
    const uptime = data?.uptime ?? ''
    const hostname = data?.hostname ?? ''

    debug('[host-status] Extracted values:', { version, uptime, hostname })

    return NextResponse.json({
      success: true,
      data: { version, uptime, hostname },
    })
  } catch (error) {
    console.error('Host status API error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch host status',
      },
      { status: 500 }
    )
  }
}
