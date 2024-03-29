import type { WebClickHouseClient } from '@clickhouse/client-web/dist/client'
import { NextResponse } from 'next/server'

import { getClient } from '@/lib/clickhouse'

const QUERY_CLEANUP_MAX_DURATION_SECONDS = 10 * 60 // 10 minutes
const MONITORING_USER = process.env.CLICKHOUSE_USER || ''

export async function GET() {
  try {
    const client = getClient(true)
    const resp = await cleanupHangQuery(client)

    return NextResponse.json(
      {
        status: true,
        ...resp,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(`[Middleware] ${error}`)
    return NextResponse.json(
      {
        status: false,
        error: `${error}`,
      },
      { status: 500 }
    )
  }
}

async function cleanupHangQuery(
  client: WebClickHouseClient
): Promise<undefined | object> {
  // Last cleanup event
  let lastCleanup = null

  try {
    const response = await client.query({
      query: `
        SELECT max(event_time) as last_cleanup
        FROM system.monitoring_events
        WHERE kind = 'LastCleanup'
        `,
      format: 'JSONEachRow',
    })
    const data: { last_cleanup: string }[] = await response.json()
    lastCleanup = data.length > 0 ? new Date(data[0].last_cleanup) : new Date()
    console.debug('[Middleware] Last cleanup:', lastCleanup)
  } catch (error) {
    throw new Error(`Error when getting last cleanup: ${error}`)
  }

  if (
    new Date().getTime() - lastCleanup.getTime() <
    QUERY_CLEANUP_MAX_DURATION_SECONDS * 1000
  ) {
    throw new Error(
      `Last cleanup was ${lastCleanup} less than ${QUERY_CLEANUP_MAX_DURATION_SECONDS}s`
    )
  }

  type KillQueryResponse = {
    meta: object[]
    data: { kill_status: string; query_id: string; user: string }[]
    rows: number
    statistics: object
  }
  let killQueryResp: KillQueryResponse

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

    killQueryResp = await resp.json<KillQueryResponse>()
    console.log(
      '[Middleware] queries found:',
      killQueryResp.data.map((row) => row.query_id).join(', ')
    )

    // Nothing to cleanup
    if (!killQueryResp || killQueryResp?.rows === 0) {
      return {
        lastCleanup,
        message: 'Nothing to cleanup',
      }
    }
  } catch (error) {
    // No query to kill, clickhouse return empty so could not parse JSON
    if (
      error instanceof Error &&
      error.message.includes('Unexpected end of JSON input')
    ) {
      return { lastCleanup, message: 'Nothing to cleanup' }
    } else {
      console.error(error)
      throw new Error(`Error when killing queries: ${error}`)
    }
  }

  try {
    await client.insert({
      table: 'system.monitoring_events',
      values: [
        {
          kind: 'LastCleanup',
          actor: MONITORING_USER,
        },
      ],
      format: 'JSONEachRow',
    })
  } catch (error) {
    throw new Error(`'LastCleanup' event creating error: ${error}`)
  }

  try {
    // Count group by kill_status
    const killStatus = killQueryResp.data.reduce(
      (acc, row) => {
        acc[row.kill_status] = (acc[row.kill_status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    console.log('[Middleware] Kill status:', killStatus)

    const value = {
      kind: 'SystemKillQuery',
      actor: MONITORING_USER,
      data: [
        `Detected ${killQueryResp.rows} hang queries`,
        `(>${QUERY_CLEANUP_MAX_DURATION_SECONDS}s),`,
        `killing them, result: ${JSON.stringify(killStatus)}`,
      ].join(' '),
    }

    await client.insert({
      table: 'system.monitoring_events',
      format: 'JSONEachRow',
      values: [value],
    })

    return value
  } catch (error) {
    console.error("[Middleware] 'SystemKillQuery' event creating error:", error)
    return
  }
}
