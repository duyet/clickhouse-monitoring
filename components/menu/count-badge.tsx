import { fetchData } from '@/lib/clickhouse'
import { Badge } from '@/components/ui/badge'

interface CountBadgeProps {
  sql?: string
  className?: string
}

export async function CountBadge({
  sql,
  className,
}: CountBadgeProps): Promise<JSX.Element | null> {
  if (!sql) return null

  let data: any[] = []

  try {
    data = await fetchData(sql)
  } catch (e: any) {
    console.error(`Could not get count for sql: ${sql}, error: ${e}`)
    return null
  }

  if (!data || !data.length || !data?.[0]?.['count()']) return null

  const count = data[0]['count()'] || data[0]['count'] || 0
  if (count == 0) return null

  return (
    <Badge className={className} variant="outline">
      {count}
    </Badge>
  )
}
