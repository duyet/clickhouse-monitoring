import { type ChartProps } from '@/components/charts/chart-props'
import { CardMetric } from '@/components/generic-charts/card-metric'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchData } from '@/lib/clickhouse'

export async function ChartDiskSize({
  name,
  title,
  className,
}: ChartProps & { name?: string }) {
  const condition = name ? `WHERE name = '${name}'` : ''
  const query = `
    SELECT name,
           (total_space - unreserved_space) AS used_space,
           formatReadableSize(used_space) AS readable_used_space,
           total_space,
           formatReadableSize(total_space) AS readable_total_space
    FROM system.disks
    ${condition}
    ORDER BY name
  `
  const { data } = await fetchData<
    {
      name: string
      used_space: number
      readable_used_space: string
      total_space: number
      readable_total_space: string
    }[]
  >({ query })
  const first = data?.[0]

  if (!data || !first) return null

  return (
    <ChartCard title={title} className={className} sql={query} data={data}>
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
