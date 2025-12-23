'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import { ErrorAlert } from '@/components/error-alert'
import { AreaChart } from '@/components/charts/base/area'
import { ChartCard } from '@/components/charts/base/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { applyInterval } from '@/lib/clickhouse-query'
import { chartTickFormatters } from '@/lib/utils'
import { formatErrorTitle, formatErrorMessage } from '@/lib/error-utils'
import { useEffect, useState } from 'react'

export function ChartCPUUsage({
  title,
  interval = 'toStartOfTenMinutes',
  lastHours = 24,
  className,
  chartClassName,
  hostId,
}: ChartProps) {
  const [data, setData] = useState<{ event_time: string; avg_cpu: number }[] | null>(null)
  const [error, setError] = useState<{ title: string; message: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const query = `
    SELECT
       ${applyInterval(interval, 'event_time')},
       avg(ProfileEvent_OSCPUVirtualTimeMicroseconds) / 1000000 as avg_cpu
    FROM merge(system, '^metric_log')
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1
    ORDER BY 1`

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const result = await fetchData<{ event_time: string; avg_cpu: number }[]>({
        query,
        hostId,
      })
      if (result.error) {
        setError({
          title: formatErrorTitle(result.error),
          message: formatErrorMessage(result.error),
        })
      } else {
        setData(result.data || [])
      }
      setLoading(false)
    }
    loadData()
  }, [query, hostId])

  if (loading) return null
  if (error) return <ErrorAlert title={error.title} message={error.message} />
  if (!data) return null

  return (
    <ChartCard
      title={title}
      className={className}
      sql={query}
      data={data || []}
      data-testid="cpu-usage-chart"
    >
      <AreaChart
        data={data || []}
        index="event_time"
        categories={['avg_cpu']}
        className={chartClassName}
        xAxisLabel="Time"
        yAxisLabel="CPU Usage (seconds)"
        yAxisTickFormatter={chartTickFormatters.duration}
      />
    </ChartCard>
  )
}

export default ChartCPUUsage
