import { ChartCard } from '@/components/chart-card'
import { type ChartProps } from '@/components/charts/chart-props'
import { CardMetric } from '@/components/tremor/card-metric'
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
  const data = await fetchData<
    {
      total_size: number
      uncompressed_size: number
      compressed_size: number
      readable_total_size: string
      readable_uncompressed_size: string
      readable_compressed_size: string
    }[]
  >({ query })
  const first = data?.[0]

  if (!data || !first) return null

  return (
    <ChartCard title={title} className={className} sql={query}>
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
