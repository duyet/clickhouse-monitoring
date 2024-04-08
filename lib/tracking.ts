import { ClickHouseClient } from '@clickhouse/client'
import type { WebClickHouseClient } from '@clickhouse/client-web/dist/client'

const log = (...args: string[]) => console.log(`[/api/init] ${args.join(' ')}`)
const error = (...args: string[]) =>
  console.error(`[/api/init] ${args.join(' ')}`)

export async function initTrackingTable(
  client: WebClickHouseClient | ClickHouseClient
) {
  log('initializing system.monitoring_events')

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
    log('created table system.monitoring_events', await response.text())
  } catch (err) {
    error('error initializing table system.monitoring_events', `${err}`)
  }
}
