import { backupsConfig } from '@/app/[host]/[query]/more/backups'
import { type ChartProps } from '@/components/charts/chart-props'
import { CardMetric } from '@/components/generic-charts/card-metric'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchData } from '@/lib/clickhouse'

export async function ChartBackupSize({
  title,
  lastHours,
  className,
}: ChartProps) {
  const startTimeCondition = lastHours
    ? `AND start_time > (now() - INTERVAL ${lastHours} HOUR)`
    : ''

  const query = `
    SELECT
      SUM(total_size) as total_size,
      SUM(uncompressed_size) as uncompressed_size,
      SUM(compressed_size) as compressed_size,
      formatReadableSize(total_size) as readable_total_size,
      formatReadableSize(uncompressed_size) as readable_uncompressed_size,
      formatReadableSize(compressed_size) as readable_compressed_size
    FROM system.backup_log
    WHERE status = 'BACKUP_CREATED'
          ${startTimeCondition}
  `

  // Create a temporary query config based on the backup config
  const chartQueryConfig = {
    ...backupsConfig,
    sql: query,
  }

  const { data, error } = await fetchData<
    {
      total_size: number
      uncompressed_size: number
      compressed_size: number
      readable_total_size: string
      readable_uncompressed_size: string
      readable_compressed_size: string
    }[]
  >({
    query,
    queryConfig: chartQueryConfig,
  })

  // If validation failed or no data, return null
  const first = data?.[0]
  if (!data || !first || error) {
    return null
  }

  return (
    <ChartCard title={title} className={className} sql={query} data={data}>
      <CardMetric
        current={first.compressed_size}
        currentReadable={`${first.readable_compressed_size} compressed`}
        target={first.uncompressed_size}
        targetReadable={`${first.readable_uncompressed_size} uncompressed`}
        className="p-2"
      />
    </ChartCard>
  )
}

export default ChartBackupSize
