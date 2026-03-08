'use client'

import { memo } from 'react'
import {
  TIME_RANGE_PRESETS,
  useTimeRange,
} from '@/lib/context/time-range-context'
import { cn } from '@/lib/utils'

/**
 * GlobalTimeRangePicker - Compact preset button group shown in the app header.
 *
 * Sets the global default lastHours used by all charts that do not have an
 * individual per-chart date range selector configured.
 */
export const GlobalTimeRangePicker = memo(function GlobalTimeRangePicker() {
  const { timeRange, setTimeRange } = useTimeRange()

  return (
    <div
      className="flex items-center gap-0.5 rounded-md border border-border/50 bg-muted/40 p-0.5"
      role="group"
      aria-label="Global time range"
    >
      {TIME_RANGE_PRESETS.map((preset) => {
        const isActive = timeRange.value === preset.value
        return (
          <button
            key={preset.value}
            type="button"
            onClick={() => setTimeRange(preset)}
            aria-pressed={isActive}
            title={`Show last ${preset.label}`}
            className={cn(
              'rounded px-2 py-0.5 text-xs font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {preset.label}
          </button>
        )
      })}
    </div>
  )
})
