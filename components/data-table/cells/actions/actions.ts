'use server'

import { fetchData } from '@/lib/clickhouse'

export async function killQuery(queryId: string) {
  console.log('Killing query', queryId)
  const res = await fetchData(`KILL QUERY WHERE query_id = '${queryId}'`)
  console.log('Killed query', queryId, res)

  return {
    message: `Killed query ${queryId}`,
  }
}

export async function optimizeTable(table: string) {
  console.log('Optimize table', table)
  const res = await fetchData(`OPTIMIZE TABLE ${table}`)
  console.log('Optimize table', table, res)

  return {
    message: `Running query optimize table ${table}`,
  }
}

export async function querySettings(queryId: string) {
  console.log('Getting query SETTINGS', queryId)
  const res = await fetchData(
    `SELECT Settings FROM system.processes WHERE query_id = '${queryId}'`
  )
  console.log('Query SETTINGS', queryId, res)

  return {
    message: JSON.stringify(res),
  }
}
