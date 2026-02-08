'use client'

import { useHostId } from '@/lib/swr'
import { memo } from 'react'
import { useChartData } from '@/lib/swr/use-chart-data'
import { buildUrl } from '@/lib/url/url-builder'
import Link from 'next/link'
import {
  ArrowRightIcon,
  CheckCircledIcon,
  ClockIcon,
} from '@radix-ui/react-icons'
import { cn } from '@/lib/utils'
import { SectionHeader } from '../section-header'

interface QueueItemProps {
  label: string
  count: number
  status: 'ok' | 'warning'
}

function QueueItem({ label, count, status }: QueueItemProps) {
  const statusConfig = {
    ok: {
      icon: CheckCircledIcon,
      className: 'text-emerald-500 dark:text-emerald-400',
    },
    warning: {
      icon: ClockIcon,
      className: 'text-amber-500 dark:text-amber-400',
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className="flex items-center gap-2">
      <Icon className={cn('h-3.5 w-3.5 shrink-0', config.className)} />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-foreground/50">
          {label}
        </div>
        <div className="font-mono text-sm font-semibold tabular-nums text-foreground/80">
          {count}
        </div>
      </div>
    </div>
  )
}

/**
 * ReplicationCard - Small bento card showing replication status
 * Displays queue count and replica health
 */
export const ReplicationCard = memo(function ReplicationCard() {
  const hostId = useHostId()

  // Fetch replication queue data
  const queueSwr = useChartData<{
    count_all: number
    count_executing: number
    count_future: number
    count_old: number
  }>({
    chartName: 'replication-queue-count',
    hostId,
    refreshInterval: 30000,
  })

  // Fetch readonly replicas
  const readonlySwr = useChartData<{ count: number }>({
    chartName: 'readonly-replica',
    hostId,
    refreshInterval: 60000,
    lastHours: 1,
    interval: 'toStartOfFifteenMinutes',
  })

  const queueCount = queueSwr.data?.[0]?.count_all ?? 0
  const readonlyCount = readonlySwr.data?.reduce(
    (sum, row) => sum + (row.count ?? 0),
    0
  )

  const isLoading = queueSwr.isLoading || readonlySwr.isLoading

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SectionHeader title="Replication" />
        <Link
          href={buildUrl('/overview', { host: hostId, tab: 'operations' })}
          className="text-xs text-foreground/50 hover:text-foreground/70 transition-colors"
        >
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {/* Queue items */}
      <div className="flex flex-1 flex-col justify-center gap-2">
        {isLoading ? (
          <>
            <div className="h-10 animate-pulse rounded bg-foreground/[0.06]" />
            <div className="h-10 animate-pulse rounded bg-foreground/[0.06]" />
          </>
        ) : (
          <>
            <QueueItem
              label="In Queue"
              count={queueCount}
              status={queueCount > 100 ? 'warning' : 'ok'}
            />
            <QueueItem
              label="Readonly"
              count={readonlyCount}
              status={readonlyCount > 0 ? 'warning' : 'ok'}
            />
          </>
        )}
      </div>
    </div>
  )
})
