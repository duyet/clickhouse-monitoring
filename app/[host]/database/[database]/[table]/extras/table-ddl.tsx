import { fetchData } from '@/lib/clickhouse'
import { getHostIdCookie } from '@/lib/scoped-link'
import { cn, dedent } from '@/lib/utils'

interface ShowSQLButtonProps {
  database: string
  table: string
  className?: string
}

export async function TableDDL({
  database,
  table,
  className,
}: ShowSQLButtonProps) {
  const hostId = await getHostIdCookie()
  const { data: showCreateTable, error } = await fetchData<
    { statement: string }[]
  >({
    query: `SHOW CREATE TABLE ${database}.${table}`,
    hostId,
  })

  if (error) {
    console.error('Failed to fetch table DDL', error)
    return null
  }

  if (!showCreateTable?.length || !showCreateTable[0]?.statement) {
    return null
  }

  const sql = showCreateTable[0].statement

  return (
    <div className={cn('w-fit overflow-auto', className)}>
      <pre className="text-sm">{dedent(sql)}</pre>
    </div>
  )
}
