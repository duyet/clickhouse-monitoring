import { getClient } from '@/lib/clickhouse'
import type { ClickHouseClient } from '@clickhouse/client'
import type { WebClickHouseClient } from '@clickhouse/client-web/dist/client'
import { NextResponse } from 'next/server'

const QUERY_CLEANUP_MAX_DURATION_SECONDS = 10 * 60 // 10 minutes
const MONITORING_USER = process.env.CLICKHOUSE_USER || ''

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  try {
    const client = await getClient({ web: false })
    const resp = await cleanupHangQuery(client)
    return NextResponse.json({ status: true, ...resp }, { status: 200 })
  } catch (error) {
    console.error('[/api/clean] error', error)
    return NextResponse.json(
      { status: false, error: `${error}` },
      { status: 500 }
    )
  }
}

type KillQueryResponse = {
  meta: object[]
  data: { kill_status: string; query_id: string; user: string }[]
  rows: number
  statistics: object
}

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

  console.log('[/api/clean] Starting clean up hang queries')

  const killQueryResp = await killHangingQueries(client)
  await updateLastCleanup(client)

  if (!killQueryResp || killQueryResp.rows === 0) {
    console.log('[/api/clean] Done, nothing to cleanup')
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
        timeout_overflow_mode: 'break',
      },
    })

    const data: { last_cleanup: string; now: string }[] = await response.json()
    const lastCleanup = new Date(data[0].last_cleanup)
    const now = new Date(data[0].now)
    console.debug(`[/api/clean] Last cleanup: ${lastCleanup}, now: ${now}`)
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
          AND elapsed > ${QUERY_CLEANUP_MAX_DURATION_SECONDS}
        ASYNC
      `,
      format: 'JSON',
    })

    const killQueryResp = await resp.json<KillQueryResponse>()

    console.log(
      '[/api/clean] queries found:',
      killQueryResp.data.map((row) => row.query_id).join(', ')
    )
    return killQueryResp
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Unexpected end of JSON input')
    ) {
      console.log('[/api/clean] Done, nothing to cleanup')
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
    console.log('[/api/clean] LastCleanup event created')
  } catch (error) {
    console.error("[/api/clean] 'LastCleanup' event creating error:", error)
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
    console.log('[/api/clean] Kill status:', killStatus)

    const value = {
      kind: 'SystemKillQuery',
      actor: MONITORING_USER,
      data: `Detected ${killQueryResp.rows} hang queries (>${QUERY_CLEANUP_MAX_DURATION_SECONDS}s), killing them, result: ${JSON.stringify(killStatus)}`,
    }

    await client.insert({
      table: 'system.monitoring_events',
      format: 'JSONEachRow',
      values: [value],
    })

    return value
  } catch (error) {
    console.error("[/api/clean] 'SystemKillQuery' event creating error:", error)
  }
}
