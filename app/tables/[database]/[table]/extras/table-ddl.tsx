import { fetchData } from '@/lib/clickhouse'
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
  let showCreateTable: { statement: string }[] = []
  try {
    showCreateTable = await fetchData(`SHOW CREATE TABLE ${database}.${table}`)
  } catch (error) {
    console.log(error)

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
