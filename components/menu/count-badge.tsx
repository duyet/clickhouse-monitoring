import { Badge } from '@/components/ui/badge'
import { fetchData } from '@/lib/clickhouse'
import { parseTableFromSQL } from '@/lib/table-validator'
import { type BadgeVariant } from '@/types/badge-variant'
import { type QueryConfig } from '@/types/query-config'

export interface CountBadgeProps {
  sql?: string
  className?: string
  variant?: BadgeVariant
}

export async function CountBadge({
  sql,
  className,
  variant = 'outline',
}: CountBadgeProps): Promise<JSX.Element | null> {
  if (!sql) return null

  // Create QueryConfig for table validation
  const tables = parseTableFromSQL(sql)
  const queryConfig: QueryConfig = {
    name: 'count-badge',
    sql: sql,
    optional: true,
    columns: ['count()'],
    // Only add tableCheck if we found tables in the SQL
    ...(tables.length > 0 && { tableCheck: tables }),
  }

  const { data, error } = await fetchData<{ 'count()': string }[]>({
    query: sql,
    format: 'JSONEachRow',
    queryConfig,
    clickhouse_settings: {
      use_query_cache: 1,
      query_cache_system_table_handling: 'save',
      query_cache_nondeterministic_function_handling: 'save',
      query_cache_ttl: 120,
    },
  })

  if (error) {
    console.error(
      `<CountBadge />: failed to get count, error: "${error.message}", query: ${sql}`
    )
    return null
  }

  // Consistent null checking pattern
  if (!data || !Array.isArray(data) || data.length === 0) {
    return null
  }

  const firstRow = data[0]
  if (!firstRow || typeof firstRow['count()'] !== 'string') {
    return null
  }

  const count = parseInt(firstRow['count()'], 10)
  if (count === 0) return null

  return (
    <Badge className={className} variant={variant}>
      {count}
    </Badge>
  )
}
