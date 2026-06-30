/**
 * Host version with status indicator for expanded sidebar state
 *
 * Shows ClickHouse version (vXX.yy format) with online/offline status indicator
 * and progressive disclosure: version → uptime based on available space.
 */

import { ClockIcon, TagIcon } from 'lucide-react'

import { formatCompactUptime } from './format-uptime'
import { useHostStatus } from '@/lib/swr/use-host-status'

interface HostVersionWithStatusProps {
  hostId: number
  variant?: 'header' | 'dropdown'
}

/**
 * Parse a full version string into a short v{major}.{minor} label.
 * e.g. "24.3.1.1" → "v24.3", "24.12.1.1234" → "v24.12"
 */
function formatShortVersion(version: string): string {
  const parts = version.split('.')
  if (parts.length >= 2) {
    return `v${parts[0]}.${parts[1]}`
  }
  return version
}

export function HostVersionWithStatus({
  hostId,
  variant = 'header',
}: HostVersionWithStatusProps) {
  const { data, isOnline, isLoading } = useHostStatus(hostId, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  })

  if (isLoading) {
    return (
      <span className="flex items-center gap-1.5 min-w-0 text-xs text-muted-foreground">
        <span className="size-2 rounded-full bg-gray-400 animate-pulse" />
        Loading…
      </span>
    )
  }

  if (isOnline && data) {
    const shortVersion = formatShortVersion(data.version)

    return (
      <span
        className="flex items-center gap-1.5 min-w-0 text-xs text-muted-foreground"
        title={`Host: ${data.hostname}\nVersion: ${data.version}\nUptime: ${data.uptime}`}
      >
        <StatusIndicatorOnline />
        <TagIcon className="size-3 shrink-0 opacity-70" />
        {/* Version is short and the priority — never shrink it. */}
        <span className="shrink-0 tabular-nums">{shortVersion}</span>

        {variant === 'dropdown' ? (
          <>
            <span className="shrink-0 opacity-40">·</span>
            {data.version}
            <span className="shrink-0 opacity-40">·</span>
            <ClockIcon className="size-3 shrink-0 opacity-70" />
            <span className="tabular-nums">
              {formatCompactUptime(data.uptime)}
            </span>
          </>
        ) : (
          <>
            <span className="shrink-0 opacity-40">·</span>
            <ClockIcon className="size-3 shrink-0 opacity-70" />
            {/* Uptime yields first: it needs min-w-0 to ellipsize inside a flex row. */}
            <span className="min-w-0 truncate tabular-nums">
              {formatCompactUptime(data.uptime)}
            </span>
          </>
        )}
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1.5 min-w-0 text-xs text-muted-foreground">
      <StatusIndicatorOffline />
      Offline
    </span>
  )
}

function StatusIndicatorOnline() {
  return <span className="flex-none size-2 rounded-full bg-emerald-500" />
}

function StatusIndicatorOffline() {
  return <span className="flex-none size-2 rounded-full bg-red-400" />
}
