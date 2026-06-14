import { ClockIcon, DatabaseIcon, HardDriveIcon, ZapIcon } from 'lucide-react'

import { StatCard, statEmpty, statLoading } from './stat-card'
import { useChartData } from '@/lib/query/use-chart-data'
import { formatDuration } from '@/lib/utils'

interface RangeStatProps {
  readonly hostId: number
  readonly lastHours?: number
}

export function LargestScanStat({ hostId, lastHours }: RangeStatProps) {
  const { data, isLoading, error, sql, metadata } = useChartData({
    chartName: 'insight-largest-scan',
    hostId,
    lastHours,
  })
  if (isLoading) return statLoading('Largest Scan')
  if (error || !data?.length)
    return statEmpty('Largest Scan', sql, data, metadata)
  const d = data[0] as Record<string, unknown>
  return (
    <StatCard
      title="Largest Scan"
      icon={<HardDriveIcon className="size-3.5 text-blue-500" />}
      sql={sql}
      data={data}
      metadata={metadata}
      value={String(d.readable_bytes)}
      subtitle={
        <>
          {String(d.readable_rows)} in{' '}
          {formatDuration(Number(d.query_duration_ms))}
        </>
      }
    />
  )
}

export function FastestScanStat({ hostId, lastHours }: RangeStatProps) {
  const { data, isLoading, error, sql, metadata } = useChartData({
    chartName: 'insight-fastest-scan',
    hostId,
    lastHours,
  })
  if (isLoading) return statLoading('Fastest Scan Speed')
  if (error || !data?.length)
    return statEmpty('Fastest Scan Speed', sql, data, metadata)
  const d = data[0] as Record<string, unknown>
  return (
    <StatCard
      title="Fastest Scan Speed"
      icon={<ZapIcon className="size-3.5 text-yellow-500" />}
      sql={sql}
      data={data}
      metadata={metadata}
      value={`${String(d.readable_speed)}/s`}
    />
  )
}

export function LongestQueryStat({ hostId, lastHours }: RangeStatProps) {
  const { data, isLoading, error, sql, metadata } = useChartData({
    chartName: 'insight-longest-query',
    hostId,
    lastHours,
  })
  if (isLoading) return statLoading('Longest Query')
  if (error || !data?.length)
    return statEmpty('Longest Query', sql, data, metadata)
  const d = data[0] as Record<string, unknown>
  return (
    <StatCard
      title="Longest Query"
      icon={<ClockIcon className="size-3.5 text-red-500" />}
      sql={sql}
      data={data}
      metadata={metadata}
      value={formatDuration(Number(d.query_duration_ms))}
    />
  )
}

export function TotalStorageStat({ hostId }: { readonly hostId: number }) {
  const { data, isLoading, error, sql, metadata } = useChartData({
    chartName: 'insight-total-storage',
    hostId,
  })
  if (isLoading) return statLoading('Total Storage')
  if (error || !data?.length)
    return statEmpty('Total Storage', sql, data, metadata)
  const d = data[0] as Record<string, unknown>
  return (
    <StatCard
      title="Total Storage"
      icon={<DatabaseIcon className="size-3.5 text-emerald-500" />}
      sql={sql}
      data={data}
      metadata={metadata}
      value={String(d.total_compressed)}
      subtitle={
        <>
          {String(d.total_tables)} tables, {String(d.readable_rows)} rows
        </>
      }
    />
  )
}
