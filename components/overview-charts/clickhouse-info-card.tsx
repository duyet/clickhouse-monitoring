'use client'

import { InfoCard } from './info-card'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useHostId } from '@/lib/swr'
import { useHostStatus } from '@/lib/swr/use-host-status'
import { getResponsiveUptimeLabels } from '@/lib/uptime-format'
import { cn } from '@/lib/utils'

// ============================================================================
// ClickHouseInfoCard Component
// ============================================================================

/**
 * ClickHouseInfoCard - Displays ClickHouse version and uptime
 * Shows static version info with optional uptime subtitle
 */

export const ClickHouseInfoCard = memo(function ClickHouseInfoCard() {
  const hostId = useHostId()
  const statusSwr = useHostStatus(hostId, { refreshInterval: 300000 })

  const version = statusSwr.data?.version ? `v${statusSwr.data?.version}` : '-'
  const uptime = statusSwr.data?.uptime ?? ''

  return (
    <InfoCard
      value={version}
      subtitle={uptime ? <UptimeSubtitle uptime={uptime} /> : undefined}
      isLoading={statusSwr.isLoading}
    />
  )
})

const uptimeSubtitleClassName = [
  'block max-w-full truncate text-center text-xs uppercase tracking-widest font-medium',
  'text-foreground/40 dark:text-foreground/35',
].join(' ')

const UptimeSubtitle = memo(function UptimeSubtitle({
  uptime,
}: {
  uptime: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const labels = useMemo(() => getResponsiveUptimeLabels(uptime), [uptime])
  const [label, setLabel] = useState(labels[0] ?? '')

  useEffect(() => {
    setLabel(labels[0] ?? '')
  }, [labels])

  useEffect(() => {
    const container = containerRef.current
    const measure = measureRef.current
    if (!container || !measure || labels.length === 0) return

    const fitLabel = () => {
      const availableWidth = container.clientWidth
      let nextLabel = labels.at(-1) ?? ''

      for (const candidate of labels) {
        measure.textContent = candidate
        if (measure.scrollWidth <= availableWidth) {
          nextLabel = candidate
          break
        }
      }

      setLabel(nextLabel)
    }

    fitLabel()

    const resizeObserver = new ResizeObserver(fitLabel)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [labels])

  if (!label) return null

  return (
    <div ref={containerRef} className="relative min-w-0 max-w-full px-2">
      <span className={uptimeSubtitleClassName} title={labels[0]}>
        {label}
      </span>
      <span
        ref={measureRef}
        className={cn(uptimeSubtitleClassName, 'invisible absolute w-max')}
        aria-hidden="true"
      />
    </div>
  )
})
