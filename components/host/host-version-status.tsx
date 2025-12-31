/**
 * Host version with status indicator for expanded sidebar state
 *
 * Shows ClickHouse version with online/offline status indicator.
 */

'use client'

import type { HostStatus } from '@/lib/swr/use-host-status'

import { useHostStatus } from '@/lib/swr/use-host-status'

interface HostVersionWithStatusProps {
  hostId: number
}

export function HostVersionWithStatus({ hostId }: HostVersionWithStatusProps) {
  const { data, isOnline, isLoading } = useHostStatus(hostId, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  })

  if (isLoading) {
    return (
      <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
        <span className="size-2 rounded-full bg-gray-400 animate-pulse" />
        Loading...
      </span>
    )
  }

  if (isOnline && data) {
    return (
      <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
        <StatusIndicatorOnline />
        {data.version}
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
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
