import { fetchData } from '@/lib/clickhouse-helpers'

export async function TableComment({
  database,
  table,
}: {
  database: string
  table: string
}) {
  try {
    const { data } = await fetchData<{ comment: string }[]>({
      query: `
          SELECT comment
            FROM system.tables
           WHERE (database = {database: String})
             AND (name = {table: String})
        `,
      query_params: { database, table },
    })

    return data?.[0]?.comment || ''
  } catch (e) {
    console.error('Error fetching table description', e)
    return ''
  }
}
