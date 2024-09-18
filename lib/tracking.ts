import { ClickHouseClient } from '@clickhouse/client'
import type { WebClickHouseClient } from '@clickhouse/client-web/dist/client'

const EVENTS_TABLE = process.env.EVENTS_TABLE_NAME || 'system.monitoring_events'

const log = (...args: string[]) => console.log(`[/api/init] ${args.join(' ')}`)
const error = (...args: string[]) =>
  console.error(`[/api/init] ${args.join(' ')}`)

const schema = [
  {
    latest: true,
    hash: '4488700278788044716',
    schema: `
      CREATE TABLE IF NOT EXISTS ${EVENTS_TABLE} (
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
    log(`creating table ${EVENTS_TABLE}`)
    const resp = await client.query({ query: latest.schema })
    log(`created table ${EVENTS_TABLE}`, await resp.text())
  } catch (err) {
    error(`error initializing table ${EVENTS_TABLE}`, `${err}`)
  }

  const expected = latest.hash

  try {
    const [database, table] = EVENTS_TABLE.split('.')
    const resp = await client.query({
      query: `
        SELECT cityHash64(groupArray(concat(name, ' ', type))) AS schema_hash
        FROM system.columns
        WHERE (database = {database:String}) AND (table = {table:String})
      `,
      query_params: { database, table },
      format: 'TabSeparated',
    })

    const current = (await resp.text()).trim()

    if (current != expected) {
      log(
        `schema hash (${current}) DO NOT matched with expected (${expected}), TODO`
      )
    } else {
      log(
        `schema hash (${current}) matched with expected (${expected}), skip migrate`
      )
    }
  } catch (err) {
    error(`error getting schema hash ${EVENTS_TABLE}`, `${err}`)
  }
}
