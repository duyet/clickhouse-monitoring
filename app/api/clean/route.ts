import type { ClickHouseClient, ResponseJSON } from '@clickhouse/client'

import type { WebClickHouseClient } from '@clickhouse/client-web/dist/client'

import { type NextRequest, NextResponse } from 'next/server'
import { getHostIdFromParams } from '@/lib/api/error-handler'
import { getClient } from '@/lib/clickhouse'
import { ErrorLogger } from '@/lib/logger'

const QUERY_CLEANUP_MAX_DURATION_SECONDS = 10 * 60 // 10 minutes
const MONITORING_USER = process.env.CLICKHOUSE_USER || ''

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  let hostId: number

  try {
    const parsedHostId = getHostIdFromParams(searchParams, {
      route: '/api/clean',
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

  try {
    // getClient will auto-detect and use web client for Cloudflare Workers
    const client = await getClient({ hostId })
    const resp = await cleanupHangQuery(client)
    return NextResponse.json({ status: true, ...resp }, { status: 200 })
  } catch (error) {
    ErrorLogger.logError(
      error instanceof Error ? error : new Error(String(error)),
      { route: '/api/clean' }
    )
    return NextResponse.json(
      { status: false, error: `${error}` },
      { status: 500 }
    )
  }
}

type KillQueryResult = { kill_status: string; query_id: string; user: string }
type KillQueryResponse = ResponseJSON<KillQueryResult>

async function cleanupHangQuery(
  client: ClickHouseClient | WebClickHouseClient
): Promise<{ lastCleanup: Date; message: string }> {
  const [lastCleanup, now] = await getLastCleanup(client)

  if (!shouldCleanup(lastCleanup, now)) {
    return {
      lastCleanup,
      message: `Not triggering cleanup, last ${lastCleanup.toISOString()}, now: ${now.toISOString()}, QUERY_CLEANUP_MAX_DURATION_SECONDS=${QUERY_CLEANUP_MAX_DURATION_SECONDS}s`,
    }
  }

  ErrorLogger.logDebug('[/api/clean] Starting clean up hang queries', {
    route: '/api/clean',
  })

  const killQueryResp = await killHangingQueries(client)
  await updateLastCleanup(client)

  if (
    !killQueryResp ||
    killQueryResp.rows === 0 ||
    killQueryResp.rows === undefined
  ) {
    ErrorLogger.logDebug('[/api/clean] Done, nothing to cleanup', {
      route: '/api/clean',
    })
    return { lastCleanup, message: 'Nothing to cleanup' }
  }

  await createSystemKillQueryEvent(client, killQueryResp)
  return { lastCleanup, message: 'Cleanup completed' }
}

async function getLastCleanup(
  client: ClickHouseClient | WebClickHouseClient
): Promise<[Date, Date]> {
  try {
    const response = await client.query({
      query: `
        SELECT max(event_time) as last_cleanup,
               now() as now
        FROM system.monitoring_events
        WHERE kind = 'LastCleanup'
      `,
      format: 'JSONEachRow',
      clickhouse_settings: {
        max_execution_time: 15,
      },
    })

    const data: { last_cleanup: string; now: string }[] = await response.json()
    const lastCleanup = new Date(data[0].last_cleanup)
    const now = new Date(data[0].now)
    ErrorLogger.logDebug(
      `[/api/clean] Last cleanup: ${lastCleanup}, now: ${now}`,
      { route: '/api/clean' }
    )
    return [lastCleanup, now]
  } catch (error) {
    throw new Error(`Error when getting last cleanup: ${error}`)
  }
}

function shouldCleanup(lastCleanup: Date, now: Date): boolean {
  const timeSinceLastCleanup = now.getTime() - lastCleanup.getTime()
  return timeSinceLastCleanup >= QUERY_CLEANUP_MAX_DURATION_SECONDS * 1000
}

async function killHangingQueries(
  client: ClickHouseClient | WebClickHouseClient
): Promise<KillQueryResponse | null> {
  try {
    const resp = await client.query({
      query: `
        KILL QUERY
        WHERE user = currentUser()
          AND read_rows = 0
          AND elapsed > {maxDuration: UInt32}
        ASYNC
      `,
      format: 'JSON',
      query_params: {
        maxDuration: QUERY_CLEANUP_MAX_DURATION_SECONDS,
      },
    })

    const killQueryResp: KillQueryResponse = await resp.json<KillQueryResult>()

    ErrorLogger.logDebug('[/api/clean] queries found', {
      route: '/api/clean',
      queryIds: killQueryResp.data.map((row) => row.query_id).join(', '),
    })
    return killQueryResp
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Unexpected end of JSON input')
    ) {
      ErrorLogger.logDebug('[/api/clean] Done, nothing to cleanup', {
        route: '/api/clean',
      })
      return null
    }
    throw new Error(`Error when killing queries: ${error}`)
  }
}

async function updateLastCleanup(
  client: ClickHouseClient | WebClickHouseClient
) {
  try {
    await client.insert({
      table: 'system.monitoring_events',
      values: [{ kind: 'LastCleanup', actor: MONITORING_USER }],
      format: 'JSONEachRow',
    })
    ErrorLogger.logDebug('[/api/clean] LastCleanup event created', {
      route: '/api/clean',
    })
  } catch (error) {
    ErrorLogger.logError(
      error instanceof Error ? error : new Error(String(error)),
      { route: '/api/clean', event: 'LastCleanup' }
    )
    throw new Error(`'LastCleanup' event creating error: ${error}`)
  }
}

async function createSystemKillQueryEvent(
  client: ClickHouseClient | WebClickHouseClient,
  killQueryResp: KillQueryResponse
) {
  try {
    const killStatus = killQueryResp.data.reduce(
      (acc, row) => {
        acc[row.kill_status] = (acc[row.kill_status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    ErrorLogger.logDebug('[/api/clean] Kill status', {
      route: '/api/clean',
      killStatus,
    })

    const rows = killQueryResp.rows ?? killQueryResp.data.length
    const value = {
      kind: 'SystemKillQuery',
      actor: MONITORING_USER,
      data: `Detected ${rows} hang queries (>${QUERY_CLEANUP_MAX_DURATION_SECONDS}s), killing them, result: ${JSON.stringify(killStatus)}`,
    }

    await client.insert({
      table: 'system.monitoring_events',
      format: 'JSONEachRow',
      values: [value],
    })

    return value
  } catch (error) {
    ErrorLogger.logError(
      error instanceof Error ? error : new Error(String(error)),
      { route: '/api/clean', event: 'SystemKillQuery' }
    )
  }
}
