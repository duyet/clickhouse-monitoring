import { ClickHouseClient } from '@clickhouse/client'
import type { WebClickHouseClient } from '@clickhouse/client-web/dist/client'

export async function initTrackingTable(
  client: WebClickHouseClient | ClickHouseClient
) {
  console.log('[Middleware] initializing system.monitoring_events')

  try {
    const response = await client.query({
      query: `
        CREATE TABLE IF NOT EXISTS system.monitoring_events (
          kind Enum('PageView', 'UserKillQuery', 'SystemKillQuery', 'LastCleanup'),
          actor LowCardinality(String) DEFAULT user(),
          data String,
          extra String,
          event_time DateTime DEFAULT now(),
          event_date Date DEFAULT today()
        ) ENGINE = ReplacingMergeTree
        PARTITION BY event_date
        ORDER BY (kind, actor, event_time)`,
    })
    console.log(
      '[Middleware] Created table system.monitoring_events',
      await response.text()
    )
  } catch (error) {
    console.error(
      '[Middleware] Error initializing table system.monitoring_events',
      error
    )
  }
}
