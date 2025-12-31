/**
 * Host status indicator for dropdown menu items
 *
 * Shows online/offline status as a colored dot indicator.
 */

'use client'

import { memo } from 'react'

import { useHostStatus } from '@/lib/swr/use-host-status'
import { StatusIndicator } from './shared'

interface HostStatusDropdownProps {
  hostId: number
}

export const HostStatusDropdown = memo(function HostStatusDropdown({
  hostId,
}: HostStatusDropdownProps) {
  const { isOnline } = useHostStatus(hostId, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  })

  if (isOnline) {
    return <StatusIndicator className="bg-emerald-500" title={['Online']} />
  }

  return <StatusIndicator title={['Offline']} />
})
