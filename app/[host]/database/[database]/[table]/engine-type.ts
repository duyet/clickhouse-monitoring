import { fetchData } from '@/lib/clickhouse'

export const engineType = async (database: string, table: string) => {
  try {
    const { data } = await fetchData<{ engine: string }[]>({
      query: `
        SELECT engine
        FROM system.tables
        WHERE (database = {database: String})
          AND (name = {table: String})
      `,
      query_params: { database, table },
    })

    return data?.[0]?.engine || ''
  } catch (error) {
    console.error(`Fetch engine type for ${database}.${table} error:`, error)
    return ''
  }
}
