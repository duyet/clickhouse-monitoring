'use client'

import { useCallback } from 'react'

export interface ReloadIntervalOption {
  label: string
  value: number // milliseconds
  shortcut?: string
}

export const RELOAD_INTERVALS: ReloadIntervalOption[] = [
  { label: '30s', value: 30_000, shortcut: '' },
  { label: '1m', value: 60_000, shortcut: '' },
  { label: '2m', value: 120_000, shortcut: '' },
  { label: '10m', value: 600_000, shortcut: '' },
  { label: '30m', value: 1_800_000, shortcut: '' },
]

export type ReloadIntervalValue = number | null

export interface UseReloadIntervalsOptions {
  /**
   * Current reload interval in milliseconds
   * null means auto-reload is disabled
   */
  reloadInterval: ReloadIntervalValue
  /**
   * Callback to update the reload interval
   */
  setReloadInterval: (interval: ReloadIntervalValue) => void
}

export interface UseReloadIntervalsReturn {
  /**
   * Available interval options
   */
  intervals: ReloadIntervalOption[]
  /**
   * Set a specific reload interval
   */
  setInterval: (interval: number) => void
  /**
   * Disable auto-reload
   */
  disableAutoReload: () => void
  /**
   * Check if a specific interval is currently active
   */
  isIntervalActive: (interval: number) => boolean
  /**
   * Check if auto-reload is currently enabled
   */
  isAutoReloadEnabled: boolean
}

/**
 * Custom hook for managing reload interval options and state
 *
 * @example
 * ```tsx
 * const {
 *   intervals,
 *   setInterval,
 *   disableAutoReload,
 *   isIntervalActive,
 *   isAutoReloadEnabled,
 * } = useReloadIntervals({
 *   reloadInterval: 30000,
 *   setReloadInterval: (interval) => context.setReloadInterval(interval),
 * })
 * ```
 */
export function useReloadIntervals({
  reloadInterval,
  setReloadInterval,
}: UseReloadIntervalsOptions): UseReloadIntervalsReturn {
  const setInterval = useCallback(
    (interval: number) => {
      setReloadInterval(interval)
    },
    [setReloadInterval]
  )

  const disableAutoReload = useCallback(() => {
    setReloadInterval(null)
  }, [setReloadInterval])

  const isIntervalActive = useCallback(
    (interval: number) => {
      return reloadInterval === interval
    },
    [reloadInterval]
  )

  return {
    intervals: RELOAD_INTERVALS,
    setInterval,
    disableAutoReload,
    isIntervalActive,
    isAutoReloadEnabled: reloadInterval != null,
  }
}
