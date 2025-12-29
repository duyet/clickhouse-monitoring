'use client'

import { MultiLineSkeleton } from '@/components/skeleton'
import { useFetchData } from '@/lib/swr'
import { cn, dedent } from '@/lib/utils'

interface ShowSQLButtonProps {
  hostId?: number
  database: string
  table: string
  className?: string
}

export function TableDDL({
  hostId,
  database,
  table,
  className,
}: ShowSQLButtonProps) {
  const { data, isLoading, error } = useFetchData<{ statement: string }[]>(
    `SHOW CREATE TABLE ${database}.${table}`,
    {},
    hostId
  )

  if (error) {
    console.error('Failed to fetch table DDL', error)
    return null
  }

  if (isLoading) {
    return <MultiLineSkeleton className="w-full" />
  }

  if (!data?.length || !data[0]?.statement) {
    return null
  }

  const sql = data[0].statement

  return (
    <div className={cn('w-fit overflow-auto', className)}>
      <pre className="text-sm">{dedent(sql)}</pre>
    </div>
  )
}
