import { fetchData, getClient, query } from '@/lib/clickhouse'
import { getHostIdCookie } from '@/lib/scoped-link'
import { dedent } from '@/lib/utils'

import type { TableChartsRow, TableSettingsRow } from './config'
import {
  TABLE_CHARTS,
  TABLE_CHARTS_DDL,
  TABLE_SETTINGS,
  TABLE_SETTINGS_DDL,
} from './config'

const clean = async () => {
  const prepare = await Promise.all([
    query(`DROP TABLE IF EXISTS ${TABLE_CHARTS}`),
    query(`DROP TABLE IF EXISTS ${TABLE_SETTINGS}`),
  ])
  console.log('Dropped custom dashboard table', prepare)
}

const create = async () => {
  const init = await Promise.all([
    query(TABLE_CHARTS_DDL),
    query(TABLE_SETTINGS_DDL),
  ])
  console.log('Intitial tables', init)
}

const migrateSettings = async () => {
  const seeds = [
    {
      key: 'params',
      value: '{ "rounding": "60", "seconds": "86400" }',
      updated_at: '1970-01-01',
    },
  ]

  for (const seed of seeds) {
    const hostId = await getHostIdCookie()
    const { data: exists } = await fetchData<TableSettingsRow[]>({
      query: `
        SELECT * FROM ${TABLE_SETTINGS}
        FINAL
        WHERE key = {key: String}`,
      query_params: { key: seed.key },
      hostId,
    })

    if (!exists || exists.length == 0) {
      const client = await getClient({ web: false })
      const resp = await client.insert({
        table: TABLE_SETTINGS,
        values: [seed],
        format: 'JSONEachRow',
      })
      console.log('Seeded dashboard params', seed.key, resp)
    }
  }
}

const migrateDashboard = async () => {
  const seeds: Omit<TableChartsRow, 'created_at' | 'updated_at'>[] = [
    {
      title: 'Query / Second',
      kind: 'area',
      query: dedent(`
        SELECT toStartOfInterval(event_time, toIntervalSecond({rounding:UInt32})) AS event_time,
               avg(ProfileEvent_Query) AS value
        FROM system.metric_log
        WHERE event_date >= toDate(now() - {seconds:UInt32})
          AND event_time >= now() - {seconds:UInt32}
        GROUP BY 1
        ORDER BY 1 WITH FILL STEP {rounding:UInt32}`),
      ordering: 0,
    },
    {
      title: 'Inserted Rows / Second',
      kind: 'bar',
      query: dedent(`
        SELECT toStartOfInterval(event_time, toIntervalSecond({rounding:UInt32})) AS event_time,
               avg(ProfileEvent_InsertedRows) AS value
        FROM system.metric_log
        WHERE event_date >= toDate(now() - {seconds:UInt32})
          AND event_time >= now() - {seconds:UInt32}
        GROUP BY 1
        ORDER BY 1 WITH FILL STEP {rounding:UInt32}
      `),
      ordering: 1,
    },
    {
      title: 'Query Count / Day',
      kind: 'calendar',
      query: dedent(`
        SELECT formatDateTime(event_time, '%Y/%m/%d') AS event_time,
               COUNT() AS count
        FROM system.query_log
        WHERE type = 'QueryFinish'
        GROUP BY 1
        ORDER BY 1 ASC
      `),
      ordering: 2,
    },
  ]

  for (const seed of seeds) {
    const hostId = await getHostIdCookie()
    const { data: exists } = await fetchData<TableChartsRow[]>({
      query: `SELECT * FROM ${TABLE_CHARTS} FINAL WHERE title = {title:String}`,
      query_params: { title: seed.title },
      hostId,
    })

    if (!exists || exists.length == 0) {
      const client = await getClient({ web: false })
      const resp = await client.insert({
        table: TABLE_CHARTS,
        values: [seed],
        format: 'JSONEachRow',
      })
      console.log('Seeded custom dashboard table', seed.title, resp)
    }
  }
}

export const seeding = async (force = false) => {
  if (force) {
    await clean()
  }

  await create()
  await migrateSettings()
  await migrateDashboard()
}
