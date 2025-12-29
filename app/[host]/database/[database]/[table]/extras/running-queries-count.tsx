'use client'

import { Badge } from '@/components/ui/badge'
import { useFetchData } from '@/lib/swr'

interface RunningQueriesProps {
  hostId?: number
  database: string
  table: string
  className?: string
}

export function RunningQueriesCount({
  hostId,
  database,
  table,
}: RunningQueriesProps) {
  const { data, error } = useFetchData<{ count: number }[]>(
    `
      SELECT COUNT() as count
      FROM system.processes
      WHERE (query LIKE '%{database: String}%')
        AND (query LIKE '%{table: String}%')`,
    {
      database,
      table,
    },
    hostId,
    5000 // refresh every 5 seconds for running queries
  )

  if (error) {
    console.error(error)
    return null
  }

  if (!data?.length) {
    return null
  }

  return <Badge variant="outline">{data[0].count || 0}</Badge>
}
