import {
  HardDriveIcon,
  MemoryStickIcon,
  ScrollTextIcon,
  SearchIcon,
} from 'lucide-react'

import { StatCard, statEmpty, statLoading } from './stat-card'
import { useChartData } from '@/lib/query/use-chart-data'

interface RangeStatProps {
  readonly hostId: number
  readonly lastHours?: number
}

export function TotalQueriesStat({ hostId, lastHours }: RangeStatProps) {
  const { data, isLoading, error, sql, metadata } = useChartData({
    chartName: 'insight-total-queries',
    hostId,
    lastHours,
  })
  if (isLoading) return statLoading('Total Queries')
  if (error || !data?.length)
    return statEmpty('Total Queries', sql, data, metadata)
  const d = data[0] as { total_queries: number; readable_count: string }
  return (
    <StatCard
      title="Total Queries"
      icon={<SearchIcon className="size-3.5 text-sky-500" />}
      sql={sql}
      data={data}
      metadata={metadata}
      value={String(d.readable_count)}
      subtitle="Completed queries"
    />
  )
}

export function TotalScannedStat({ hostId, lastHours }: RangeStatProps) {
  const { data, isLoading, error, sql, metadata } = useChartData({
    chartName: 'insight-total-scanned',
    hostId,
    lastHours,
  })
  if (isLoading) return statLoading('Total Data Scanned')
  if (error || !data?.length)
    return statEmpty('Total Data Scanned', sql, data, metadata)
  const d = data[0] as { total_bytes: number; readable_total: string }
  return (
    <StatCard
      title="Total Data Scanned"
      icon={<HardDriveIcon className="size-3.5 text-violet-500" />}
      sql={sql}
      data={data}
      metadata={metadata}
      value={String(d.readable_total)}
      subtitle="Read across all queries"
    />
  )
}

export function TotalRowsReadStat({ hostId, lastHours }: RangeStatProps) {
  const { data, isLoading, error, sql, metadata } = useChartData({
    chartName: 'insight-total-rows-read',
    hostId,
    lastHours,
  })
  if (isLoading) return statLoading('Total Rows Read')
  if (error || !data?.length)
    return statEmpty('Total Rows Read', sql, data, metadata)
  const d = data[0] as { total_rows: number; readable_total: string }
  return (
    <StatCard
      title="Total Rows Read"
      icon={<ScrollTextIcon className="size-3.5 text-blue-500" />}
      sql={sql}
      data={data}
      metadata={metadata}
      value={String(d.readable_total)}
      subtitle="Rows scanned by all queries"
    />
  )
}

export function PeakMemoryStat({ hostId, lastHours }: RangeStatProps) {
  const { data, isLoading, error, sql, metadata } = useChartData({
    chartName: 'insight-peak-memory',
    hostId,
    lastHours,
  })
  if (isLoading) return statLoading('Peak Memory')
  if (error || !data?.length)
    return statEmpty('Peak Memory', sql, data, metadata)
  const d = data[0] as { peak_memory: number; readable_peak: string }
  return (
    <StatCard
      title="Peak Memory"
      icon={<MemoryStickIcon className="size-3.5 text-pink-500" />}
      sql={sql}
      data={data}
      metadata={metadata}
      value={String(d.readable_peak)}
      subtitle="Highest query memory usage"
    />
  )
}
