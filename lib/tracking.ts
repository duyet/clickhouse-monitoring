import { ClickHouseClient } from '@clickhouse/client'
import type { WebClickHouseClient } from '@clickhouse/client-web/dist/client'

const log = (...args: string[]) => console.log(`[/api/init] ${args.join(' ')}`)
const error = (...args: string[]) =>
  console.error(`[/api/init] ${args.join(' ')}`)

const schema = [
  {
    latest: true,
    hash: '4488700278788044716',
    schema: `
      CREATE TABLE IF NOT EXISTS system.monitoring_events (
        kind Enum('PageView', 'UserKillQuery', 'SystemKillQuery', 'LastCleanup'),
        actor LowCardinality(String) DEFAULT user(),
        data String,
        extra String,
        event_time DateTime DEFAULT now(),
        event_date Date DEFAULT today()
      ) ENGINE = ReplacingMergeTree
      PARTITION BY event_date
      ORDER BY (kind, actor, event_time)
    `,
  },
]

export async function initTrackingTable(
  client: WebClickHouseClient | ClickHouseClient
) {
  const latest = schema.find((s) => s.latest)
  if (!latest) return error('no latest schema found')

  try {
    log('creating table system.monitoring_events')
    const resp = await client.query({ query: latest.schema })
    log('created table system.monitoring_events', await resp.text())
  } catch (err) {
    error('error initializing table system.monitoring_events', `${err}`)
  }

  const expected = latest.hash

  try {
    const resp = await client.query({
      query: `
        SELECT cityHash64(groupArray(concat(name, ' ', type))) AS schema_hash
        FROM system.columns
        WHERE (database = 'system') AND (table = 'monitoring_events')
      `,
      format: 'TabSeparated',
    })

    const current = (await resp.text()).trim()

    log('Schema hash', current)
    log('Schema hash (expected)', expected)

    if (current != expected) {
      log('TODO: do schema migration')
    } else {
      log('schema hash matched, skip migrate')
    }
  } catch (err) {
    error('error getting schema hash system.monitoring_events', `${err}`)
  }
}
