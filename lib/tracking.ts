import type { ClickHouseClient } from '@clickhouse/client'
import type { WebClickHouseClient } from '@clickhouse/client-web/dist/client'
import { ErrorLogger } from '@/lib/logger'

const EVENTS_TABLE = process.env.EVENTS_TABLE_NAME || 'system.monitoring_events'

const log = (...args: string[]) =>
  ErrorLogger.logDebug(`[/api/init] ${args.join(' ')}`, {
    component: 'tracking',
  })
const error = (...args: string[]) =>
  ErrorLogger.logWarning(`[/api/init] ${args.join(' ')}`, {
    component: 'tracking',
  })

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
    const resp = await client.query({ query: latest.schema })
    log(`CREATE TABLE IF NOT EXISTS ${EVENTS_TABLE}: done`, await resp.text())
  } catch (err) {
    log(`CREATE TABLE IF NOT EXISTS ${EVENTS_TABLE}: failed ${err}`)
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

    if (current !== expected) {
      log(
        `schema hash (${current}) DO NOT matched with expected (${expected}), TODO`
      )
    } else {
      log(
        `schema hash (${current}) matched with expected (${expected}), skip migration`
      )
    }
  } catch (err) {
    error(`error getting schema hash ${EVENTS_TABLE}`, `${err}`)
  }
}
