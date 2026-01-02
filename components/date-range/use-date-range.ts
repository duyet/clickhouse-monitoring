'use client'

import type { DateRangeConfig, DateRangeValue } from './date-range-types'

import { useState, useCallback, useMemo } from 'react'

interface UseDateRangeOptions {
  /** Date range configuration */
  config: DateRangeConfig
  /** Override initial value (instead of config.defaultValue) */
  initialValue?: string
  /** Callback when range changes */
  onRangeChange?: (range: DateRangeValue) => void
}

interface UseDateRangeReturn {
  /** Current selected value (e.g., "24h") */
  value: string
  /** Current lastHours number (undefined for "all" range) */
  lastHours?: number
  /** Current interval */
  interval: string
  /** Full DateRangeValue object */
  range: DateRangeValue
  /** Handler for DateRangeSelector onChange */
  setRange: (range: DateRangeValue) => void
  /** Reset to default value */
  reset: () => void
}

/**
 * Hook for managing date range state
 *
 * Provides local state management that works with SWR caching.
 * Different lastHours values create different cache keys, enabling
 * instant switching back to previously-fetched ranges.
 *
 * @example
 * ```tsx
 * const { lastHours, interval, setRange } = useDateRange({
 *   config: DATE_RANGE_PRESETS.standard,
 * })
 *
 * const swr = useChartData({
 *   chartName: 'query-count',
 *   hostId,
 *   lastHours,
 *   interval,
 * })
 * ```
 */
export function useDateRange({
  config,
  initialValue,
  onRangeChange,
}: UseDateRangeOptions): UseDateRangeReturn {
  // Get initial option
  const defaultOption = useMemo(() => {
    const targetValue = initialValue ?? config.defaultValue
    return (
      config.options.find((o) => o.value === targetValue) ?? config.options[0]
    )
  }, [config, initialValue])

  // Local state
  const [range, setRangeState] = useState<DateRangeValue>({
    value: defaultOption.value,
    lastHours: defaultOption.lastHours,
    interval: defaultOption.interval,
  })

  // Change handler with callback
  const setRange = useCallback(
    (newRange: DateRangeValue) => {
      setRangeState(newRange)
      onRangeChange?.(newRange)
    },
    [onRangeChange]
  )

  // Reset to default
  const reset = useCallback(() => {
    const resetRange: DateRangeValue = {
      value: defaultOption.value,
      lastHours: defaultOption.lastHours,
      interval: defaultOption.interval,
    }
    setRangeState(resetRange)
    onRangeChange?.(resetRange)
  }, [defaultOption, onRangeChange])

  return {
    value: range.value,
    lastHours: range.lastHours,
    interval: range.interval,
    range,
    setRange,
    reset,
  }
}
