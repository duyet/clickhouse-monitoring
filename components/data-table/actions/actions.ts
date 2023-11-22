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
