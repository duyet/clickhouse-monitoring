import { fetchDataWithCache } from '@/lib/clickhouse'

export const engineType = async (database: string, table: string) => {
  const resp = await fetchDataWithCache()<{ engine: string }[]>({
    query: `
      SELECT engine
      FROM system.tables
      WHERE (database = {database: String})
        AND (name = {table: String})
    `,
    query_params: { database, table },
  })

  return resp?.[0]?.engine || ''
}
