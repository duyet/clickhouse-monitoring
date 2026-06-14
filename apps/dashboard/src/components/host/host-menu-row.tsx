import { Check, ClockIcon, TagIcon } from 'lucide-react'

import { formatCompactUptime } from './format-uptime'
import { StatusIndicator } from './shared'
import { Skeleton } from '@/components/ui/skeleton'
import { useHostStatus } from '@/lib/swr/use-host-status'
import { cn } from '@/lib/utils'

interface HostMenuRowProps {
  hostId: number
  hostName: string
  isActive: boolean
}

export const HostMenuRow = function HostMenuRow({
  hostId,
  hostName,
  isActive,
}: HostMenuRowProps) {
  const { data, isOnline, isLoading } = useHostStatus(hostId, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  })

  const dotClass = isLoading
    ? 'bg-gray-400 animate-pulse'
    : isOnline
      ? 'bg-emerald-500'
      : 'bg-red-400'

  const tooltip = isLoading
    ? ['Checking...']
    : isOnline && data
      ? [`Host: ${data.hostname}`, `Uptime: ${data.uptime}`]
      : ['Offline']

  return (
    <div className="flex w-full items-center gap-2.5">
      <StatusIndicator className={dotClass} title={tooltip} />
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-sm font-medium">{hostName}</span>
        {isLoading ? (
          <Skeleton className="mt-0.5 h-3 w-24" />
        ) : isOnline && data ? (
          <span
            className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground"
            title={`Version ${data.version} · Uptime ${data.uptime}`}
          >
            <TagIcon className="size-3 shrink-0 opacity-70" />
            {/* Version is short and the priority — never shrink it. */}
            <span className="shrink-0 tabular-nums">{data.version}</span>
            <span className="shrink-0 opacity-40">·</span>
            <ClockIcon className="size-3 shrink-0 opacity-70" />
            {/* Uptime yields first: it needs min-w-0 to ellipsize inside a flex row. */}
            <span className="min-w-0 truncate tabular-nums">
              {formatCompactUptime(data.uptime)}
            </span>
          </span>
        ) : (
          <span className="truncate text-xs text-muted-foreground">
            Offline
          </span>
        )}
      </div>
      <Check
        className={cn(
          'ml-auto size-4 shrink-0 text-muted-foreground transition-opacity',
          isActive ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  )
}
