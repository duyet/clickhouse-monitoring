import { fetchData } from '@/lib/clickhouse'
import { ChartCard } from '@/components/chart-card'
import { type ChartProps } from '@/components/charts/chart-props'
import { CardMetric } from '@/components/tremor'

export async function ChartDiskSize({ title, className }: ChartProps) {
  const sql = `
    SELECT name,
           (total_space - unreserved_space) AS used_space,
           formatReadableSize(used_space) AS readable_used_space,
           total_space,
           formatReadableSize(total_space) AS readable_total_space
    FROM system.disks
    ORDER BY name
  `
  const data = await fetchData(sql)
  const first = data?.[0]

  if (!data || !first) return null

  return (
    <ChartCard title={title} className={className} sql={sql}>
      <CardMetric
        current={first.used_space}
        currentReadable={`${first.readable_used_space} used (${first.name})`}
        target={first.total_space}
        targetReadable={`${first.readable_total_space} total`}
        className="p-2"
      />
    </ChartCard>
  )
}

export default ChartDiskSize
