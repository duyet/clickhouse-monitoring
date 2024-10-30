'use server'

import { fetchData, getClient } from '@/lib/clickhouse'

import { FormSchema } from './chart-params'
import type { TableChartsRow, TableSettingsRow } from './config'
import { TABLE_CHARTS, TABLE_SETTINGS } from './config'
import { seeding } from './seeding'

export const getCustomDashboards = async () => {
  await seeding()

  const q1 = fetchData<TableChartsRow[]>({
    query: `SELECT * FROM ${TABLE_CHARTS} FINAL ORDER BY ordering ASC`,
  }).then((res) => res.data)
  const q2 = fetchData<TableSettingsRow[]>({
    query: `SELECT * FROM ${TABLE_SETTINGS} FINAL`,
  }).then((res) => res.data)

  const [dashboards, settings] = await Promise.all([q1, q2])

  return { dashboards, settings }
}

export async function updateSettingParams(
  data: Record<string, string> | FormSchema
) {
  const query = `
    ALTER TABLE ${TABLE_SETTINGS}
    UPDATE value = {value: String}, updated_at = NOW()
    WHERE key = {key: String}`

  const query_params = {
    key: 'params',
    value: JSON.stringify(data),
  }

  const client = await getClient({ web: false })
  const resp = await client.command({
    query,
    query_params,
  })

  console.log(`Update ${TABLE_SETTINGS} query:`, query)
  console.log(`Update${TABLE_SETTINGS} params:`, query_params)
  console.log(`Update ${TABLE_SETTINGS} resp:`, resp)

  return resp
}

export async function updateChart(data: Record<string, string> | FormSchema) {
  const query = `
    ALTER TABLE ${TABLE_CHARTS}
    UPDATE query = {query: String}, updated_at = NOW()
    WHERE title = {title: String}`

  const query_params = {
    key: 'params',
    value: JSON.stringify(data),
  }

  const client = await getClient({ web: false })
  const resp = await client.command({
    query,
    query_params,
  })

  console.log(`Update ${TABLE_SETTINGS} query:`, query)
  console.log(`Update${TABLE_SETTINGS} params:`, query_params)
  console.log(`Update ${TABLE_SETTINGS} resp:`, resp)

  return resp
}
