import { Badge } from '@/components/ui/badge'
import { fetchData } from '@/lib/clickhouse'

interface RunningQueriesProps {
  database: string
  table: string
  className?: string
}

export async function RunningQueriesCount({
  database,
  table,
}: RunningQueriesProps) {
  let data: { count: number }[] = []
  try {
    data = await fetchData<{ count: number }[]>({
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
  } catch (error) {
    console.error(error)
    return null
  }

  if (!data?.length) {
    return null
  }

  return <Badge variant="outline">{data[0].count || 0}</Badge>
}
