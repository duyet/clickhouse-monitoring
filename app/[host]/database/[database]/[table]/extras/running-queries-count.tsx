import { Badge } from '@/components/ui'
import { fetchData } from '@/lib/clickhouse-helpers'

interface RunningQueriesProps {
  database: string
  table: string
  className?: string
}

export async function RunningQueriesCount({
  database,
  table,
}: RunningQueriesProps) {
  try {
    const { data, error } = await fetchData<{ count: number }[]>({
      query: `
        SELECT COUNT() as count
        FROM system.processes
        WHERE (query LIKE '%{database: String}%')
          AND (query LIKE '%{table: String}%')`,
      query_params: {
        database,
        table,
      },
    })

    if (error) {
      console.error('Error fetching running queries count:', error)
      return null
    }

    if (!data?.length) {
      return null
    }

    return <Badge variant="outline">{data[0].count || 0}</Badge>
  } catch (error) {
    console.error(error)
    return null
  }
}
