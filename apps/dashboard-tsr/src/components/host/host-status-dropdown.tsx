/**
 * Host status indicator for dropdown menu items
 *
 * Shows online/offline status as a colored dot indicator.
 * Shows checking effect while loading status.
 */

import { StatusIndicator } from './shared'
import { useHostStatus } from '@/lib/swr/use-host-status'

interface HostStatusDropdownProps {
  hostId: number
}

export const HostStatusDropdown = function HostStatusDropdown({
  hostId,
}: HostStatusDropdownProps) {
  const { isOnline, isLoading } = useHostStatus(hostId, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  })

  if (isLoading) {
    return (
      <StatusIndicator
        className="bg-gray-400 animate-pulse"
        title={['Checking...']}
      />
    )
  }

  if (isOnline) {
    return <StatusIndicator className="bg-emerald-500" title={['Online']} />
  }

  return <StatusIndicator title={['Offline']} />
}
