'use client'

import { ArrowRightIcon } from '@radix-ui/react-icons'

import { BentoCardWrapper } from './bento-card-wrapper'
import Link from 'next/link'
import { memo } from 'react'
import { AnimatedNumber } from '@/components/cards/metric/animated-number'
import { useHostId } from '@/lib/swr'
import { useChartData } from '@/lib/swr/use-chart-data'
import { buildUrl } from '@/lib/url/url-builder'
import { cn } from '@/lib/utils'

/**
 * MergeOperationsCard - Small bento card showing merge operations status
 * Displays current merge count with progress bars
 */
export const MergeOperationsCard = memo(function MergeOperationsCard() {
  const hostId = useHostId()

  // Fetch current merge count
  const mergeSwr = useChartData<{ avg_CurrentMetric_Merge: number }>({
    chartName: 'merge-count',
    hostId,
    refreshInterval: 30000,
    lastHours: 1,
    interval: 'toStartOfFiveMinutes',
  })

  const currentMerges = mergeSwr.data?.[0]?.avg_CurrentMetric_Merge ?? 0

  return (
    <BentoCardWrapper className="p-3">
      <div className="flex h-full flex-col gap-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground/80">Merges</h3>
          <Link
            href={buildUrl('/merges', { host: hostId })}
            className="text-xs text-foreground/50 hover:text-foreground/70 transition-colors"
          >
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {/* Main metric */}
        <div className="flex flex-1 flex-col justify-center gap-2">
          {mergeSwr.isLoading ? (
            <div className="h-12 animate-pulse rounded-lg bg-foreground/[0.06]" />
          ) : (
            <>
              <AnimatedNumber
                value={currentMerges}
                className="text-2xl font-mono font-semibold tabular-nums text-foreground/90"
              />
              <div className="text-xs text-foreground/50">active merges</div>
            </>
          )}

          {/* Progress bars for merge status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/[0.06]">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    currentMerges > 50
                      ? 'bg-rose-500'
                      : currentMerges > 20
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  )}
                  style={{ width: `${Math.min(currentMerges, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </BentoCardWrapper>
  )
})
