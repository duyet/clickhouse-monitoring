/**
 * Status indicator overlay for the logo in collapsed sidebar state
 *
 * Shows a small colored dot at the corner of the logo indicating
 * ClickHouse connection status (online/offline/checking).
 */

'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { useHostStatus } from '@/lib/swr/use-host-status'

interface LogoStatusIndicatorProps {
  hostId: number
}

/**
 * Small status indicator positioned at bottom-right corner of logo
 * Only visible when sidebar is collapsed.
 */
export const LogoStatusIndicator = memo(function LogoStatusIndicator({
  hostId,
}: LogoStatusIndicatorProps) {
  const { isOnline, isLoading } = useHostStatus(hostId, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  })

  return (
    <span
      className={cn(
        'absolute -bottom-0.5 -left-1 size-1.5 rounded-full',
        'ring-2 ring-sidebar',
        isLoading && 'bg-gray-400 animate-pulse',
        !isLoading && isOnline && 'bg-emerald-500',
        !isLoading && !isOnline && 'bg-red-400'
      )}
      title={isLoading ? 'Checking...' : isOnline ? 'Online' : 'Offline'}
    />
  )
})
