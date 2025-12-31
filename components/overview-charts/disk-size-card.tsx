'use client'

import { memo } from 'react'
import { useChartData } from '@/lib/swr/use-chart-data'
import { useHostId } from '@/lib/swr'
import { buildUrl } from '@/lib/url/url-builder'
import { ProgressCard } from './progress-card'
import type { CardVariant } from './card-styles'

// ============================================================================
// DiskSizeCard Component
// ============================================================================

/**
 * DiskSizeCard - Displays disk usage with progress bar
 * Shows animated size value and visual progress indicator
 * Color changes based on usage percentage (warning > 75%, danger > 90%)
 */

export const DiskSizeCard = memo(function DiskSizeCard() {
  const hostId = useHostId()
  const swr = useChartData<{
    name: string
    used_space: number
    readable_used_space: string
    total_space: number
    readable_total_space: string
  }>({
    chartName: 'disk-size-single',
    hostId,
    refreshInterval: 30000,
  })

  const used = swr.data?.[0]?.used_space ?? 0
  const total = swr.data?.[0]?.total_space ?? 1
  const readableUsed = swr.data?.[0]?.readable_used_space ?? '-'
  const percent = total > 0 ? (used / total) * 100 : 0

  const variant: CardVariant =
    percent > 90 ? 'danger' : percent > 75 ? 'warning' : 'default'

  return (
    <ProgressCard
      value={readableUsed}
      percent={percent}
      href={buildUrl('/disks', { host: hostId })}
      variant={variant}
    />
  )
})
