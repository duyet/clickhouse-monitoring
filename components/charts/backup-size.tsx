import { fetchData } from '@/lib/clickhouse'
import { ChartCard } from '@/components/chart-card'
import type { ChartProps } from '@/components/charts/chart-props'
import { CardMetric } from '@/components/tremor'

export async function ChartBackupSize({
  title,
  lastHours,
  className,
}: ChartProps) {
  const startTimeCondition = lastHours
    ? `AND start_time > (now() - INTERVAL ${lastHours} HOUR)`
    : ''

  const sql = `
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
  const data = await fetchData(sql)
  const first = data?.[0]

  if (!data || !first) return null

  return (
    <ChartCard title={title} className={className} sql={sql}>
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
