import { NextResponse } from 'next/server'
import { createValidationError } from '@/lib/api/error-handler'
import { getAndValidateHostId } from '@/lib/api/shared/validators'
import { fetchData } from '@/lib/clickhouse'
import { QUERY_COMMENT } from '@/lib/clickhouse/constants'
import { debug } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT = {
  route: '/api/v1/host-status',
  method: 'GET',
} as const

/**
 * GET /api/v1/host-status?hostId=0
 *
 * Returns host status information (version, uptime, hostname) in a single request.
 * This endpoint consolidates three separate chart calls into one for efficiency.
 */
export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams
  const hostIdResult = getAndValidateHostId(searchParams)

  if (typeof hostIdResult !== 'number') {
    return createValidationError(hostIdResult.message, ROUTE_CONTEXT)
  }

  const hostId = hostIdResult

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
