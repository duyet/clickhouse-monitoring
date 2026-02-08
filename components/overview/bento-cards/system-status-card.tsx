'use client'

import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons'

import { SectionHeader } from '../section-header'
import { memo } from 'react'
import { useHostId } from '@/lib/swr'
import { useChartData } from '@/lib/swr/use-chart-data'
import { useHostStatus } from '@/lib/swr/use-host-status'
import { cn } from '@/lib/utils'

interface StatusItemProps {
  label: string
  value: string
  status: 'ok' | 'error'
}

function StatusItem({ label, value, status }: StatusItemProps) {
  const statusConfig = {
    ok: {
      icon: CheckCircledIcon,
      className: 'text-emerald-500 dark:text-emerald-400',
    },
    error: {
      icon: CrossCircledIcon,
      className: 'text-rose-500 dark:text-rose-400',
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className="flex items-center gap-2">
      <Icon className={cn('h-3.5 w-3.5 shrink-0', config.className)} />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-foreground/50 truncate">
          {label}
        </div>
        <div className="font-mono text-sm font-semibold tabular-nums text-foreground/80 truncate">
          {value}
        </div>
      </div>
    </div>
  )
}

/**
 * SystemStatusCard - Small bento card showing system status
 * Displays ClickHouse version, uptime, and key system info
 */
export const SystemStatusCard = memo(function SystemStatusCard() {
  const hostId = useHostId()

  // Fetch host status
  const statusSwr = useHostStatus(hostId, { refreshInterval: 300000 })

  // Fetch database and table counts
  const databaseSwr = useChartData<{ count: number }>({
    chartName: 'database-count',
    hostId,
    refreshInterval: 300000,
  })

  const tablesSwr = useChartData<{ count: number }>({
    chartName: 'table-count',
    hostId,
    refreshInterval: 300000,
  })

  const version = statusSwr.data?.version ? `v${statusSwr.data.version}` : '-'
  const uptime = statusSwr.data?.uptime ?? '-'
  const dbCount = databaseSwr.data?.[0]?.count ?? 0
  const tableCount = tablesSwr.data?.[0]?.count ?? 0

  const isLoading =
    statusSwr.isLoading || databaseSwr.isLoading || tablesSwr.isLoading

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Header */}
      <SectionHeader title="System" />

      {/* Status items */}
      <div className="flex flex-1 flex-col justify-center gap-2">
        {isLoading ? (
          <>
            <div className="h-10 rounded bg-foreground/[0.06] [animation:pulse_1.5s_ease-in-out_infinite] motion-reduce:transition-opacity motion-reduce:opacity-50" />
            <div className="h-10 rounded bg-foreground/[0.06] [animation:pulse_1.5s_ease-in-out_infinite] motion-reduce:transition-opacity motion-reduce:opacity-50" />
            <div className="h-10 rounded bg-foreground/[0.06] [animation:pulse_1.5s_ease-in-out_infinite] motion-reduce:transition-opacity motion-reduce:opacity-50" />
          </>
        ) : (
          <>
            <StatusItem label="Version" value={version} status="ok" />
            <StatusItem label="Uptime" value={uptime} status="ok" />
            <StatusItem
              label="Tables"
              value={`${dbCount} db / ${tableCount} tbl`}
              status="ok"
            />
          </>
        )}
      </div>
    </div>
  )
})
