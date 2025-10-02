import { fetchData } from '@/lib/clickhouse'
import { getHostIdCookie } from '@/lib/scoped-link'

export const engineType = async (database: string, table: string) => {
  try {
    const hostId = await getHostIdCookie()
    const { data } = await fetchData<{ engine: string }[]>({
      query: `
        SELECT engine
        FROM system.tables
        WHERE (database = {database: String})
          AND (name = {table: String})
      `,
      query_params: { database, table },
      hostId,
    })

    return data?.[0]?.engine || ''
  } catch (error) {
    console.error(`Fetch engine type for ${database}.${table} error:`, error)
    return ''
  }
}
