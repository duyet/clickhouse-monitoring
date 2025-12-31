'use client'

import { memo } from 'react'
import { useHostId } from '@/lib/swr'
import { useHostStatus } from '@/lib/swr/use-host-status'
import { InfoCard } from './info-card'

// ============================================================================
// ClickHouseInfoCard Component
// ============================================================================

/**
 * ClickHouseInfoCard - Displays ClickHouse version and uptime
 * Shows static version info with optional uptime subtitle
 */

export const ClickHouseInfoCard = memo(function ClickHouseInfoCard() {
  const hostId = useHostId()
  const statusSwr = useHostStatus(hostId, { refreshInterval: 30000 })

  const version = statusSwr.data?.version ? `v${statusSwr.data?.version}` : '-'
  const uptime = statusSwr.data?.uptime ?? ''

  return (
    <InfoCard
      value={version}
      subtitle={uptime ? `up ${uptime}` : undefined}
      isLoading={statusSwr.isLoading}
    />
  )
})
