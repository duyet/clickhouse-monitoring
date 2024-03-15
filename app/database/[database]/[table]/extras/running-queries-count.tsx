import { fetchData } from '@/lib/clickhouse'
import { Badge } from '@/components/ui/badge'

interface RunningQueriesProps {
  database: string
  table: string
  className?: string
}

export async function RunningQueriesCount({
  database,
  table,
}: RunningQueriesProps) {
  let data: { [key: string]: string }[] = []
  try {
    data = await fetchData(
      `SELECT COUNT() as count
       FROM system.processes
       WHERE (query LIKE '%{database: String}%')
         AND (query LIKE '%{table: String}%')`,
      {
        database,
        table,
      }
    )
  } catch (error) {
    console.error(error)
    return null
  }

  if (!data?.length) {
    return null
  }

  return <Badge variant="outline">{data[0].count || 0}</Badge>
}
