'use client'

import { useHostId } from '@/lib/swr'
import { memo } from 'react'
import { useChartData } from '@/lib/swr/use-chart-data'
import { cn } from '@/lib/utils'
import { SectionHeader } from '../section-header'

interface MetricMiniProps {
  label: string
  value: string
  percent: number
  className?: string
}

function MetricMini({ label, value, percent, className }: MetricMiniProps) {
  const getColor = (p: number) => {
    if (p >= 90) return 'text-rose-500 dark:text-rose-400'
    if (p >= 75) return 'text-amber-500 dark:text-amber-400'
    return 'text-emerald-500 dark:text-emerald-400'
  }

  return (
    <div className={cn('flex flex-col gap-1.5 min-w-0', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-foreground/50">
          {label}
        </span>
        <span
          className={cn('text-xs font-medium tabular-nums', getColor(percent))}
        >
          {percent.toFixed(0)}%
        </span>
      </div>
      <div className="text-sm font-mono font-semibold tabular-nums text-foreground/80 truncate">
        {value}
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            getColor(percent).replace('text-', 'bg-')
          )}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  )
}

/**
 * SystemMetricsCard - Medium bento card showing CPU, Memory, and Disk usage
 * Displays mini sparklines and progress bars for key system metrics
 */
export const SystemMetricsCard = memo(function SystemMetricsCard() {
  const hostId = useHostId()

  // Fetch latest metrics for mini displays
  const cpuSwr = useChartData<{ avg_cpu: number }>({
    chartName: 'cpu-usage',
    hostId,
    refreshInterval: 30000,
    lastHours: 1,
    interval: 'toStartOfTenMinutes',
  })

  const memorySwr = useChartData<{ avg_memory: number }>({
    chartName: 'memory-usage',
    hostId,
    refreshInterval: 30000,
    lastHours: 1,
    interval: 'toStartOfTenMinutes',
  })

  const diskSwr = useChartData<{
    used_space: number
    readable_used_space: string
    total_space: number
  }>({
    chartName: 'disk-size-single',
    hostId,
    refreshInterval: 120000,
  })

  const latestCpu = cpuSwr.data?.[0]?.avg_cpu ?? 0
  const latestMemory = memorySwr.data?.[0]?.avg_memory ?? 0
  const diskUsed = diskSwr.data?.[0]?.used_space ?? 0
  const diskTotal = diskSwr.data?.[0]?.total_space ?? 1
  const diskPercent = diskTotal > 0 ? (diskUsed / diskTotal) * 100 : 0

  // Format values for display
  const formatCpu = (value: number) => {
    if (value < 1) return `${(value * 100).toFixed(1)}%`
    return `${value.toFixed(1)} cores`
  }

  const formatMemory = (bytes: number) => {
    const gb = bytes / 1024 ** 3
    return `${gb.toFixed(1)} GB`
  }

  const isLoading = cpuSwr.isLoading || memorySwr.isLoading || diskSwr.isLoading

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Header */}
      <SectionHeader title="System Metrics" />

      {/* Mini Metrics */}
      <div className="flex flex-1 flex-col justify-center gap-2">
        {isLoading ? (
          <>
            <div className="h-12 animate-pulse rounded bg-foreground/[0.06]" />
            <div className="h-12 animate-pulse rounded bg-foreground/[0.06]" />
            <div className="h-12 animate-pulse rounded bg-foreground/[0.06]" />
          </>
        ) : (
          <>
            <MetricMini
              label="CPU"
              value={formatCpu(latestCpu)}
              percent={Math.min(latestCpu * 10, 100)}
            />
            <MetricMini
              label="Memory"
              value={formatMemory(latestMemory)}
              percent={(latestMemory / (16 * 1024 ** 3)) * 100} // Assume 16GB baseline
            />
            <MetricMini
              label="Disk"
              value={diskSwr.data?.[0]?.readable_used_space ?? '-'}
              percent={diskPercent}
            />
          </>
        )}
      </div>
    </div>
  )
})
