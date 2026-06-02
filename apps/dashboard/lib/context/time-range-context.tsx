'use client'

import type { ClickHouseInterval } from '@chm/types/clickhouse-interval'

import { createContext, use, useState } from 'react'

export interface TimeRangeOption {
  /** Display label shown in the picker (e.g., "24h") */
  label: string
  /** Unique identifier */
  value: string
  /** Number of hours of history to fetch */
  lastHours: number
  /** Recommended ClickHouse interval function for this range */
  interval: ClickHouseInterval
}

export const TIME_RANGE_PRESETS: TimeRangeOption[] = [
  { label: '1h', value: '1h', lastHours: 1, interval: 'toStartOfMinute' },
  {
    label: '6h',
    value: '6h',
    lastHours: 6,
    interval: 'toStartOfFiveMinutes',
  },
  { label: '24h', value: '24h', lastHours: 24, interval: 'toStartOfHour' },
  {
    label: '7d',
    value: '7d',
    lastHours: 24 * 7,
    interval: 'toStartOfHour',
  },
  {
    label: '30d',
    value: '30d',
    lastHours: 24 * 30,
    interval: 'toStartOfDay',
  },
]

const DEFAULT_TIME_RANGE = TIME_RANGE_PRESETS[2] // 24h

/** localStorage key for the persisted global time range */
const STORAGE_KEY = 'chm-global-time-range'
/** URL search param used to share the active time range */
const SEARCH_PARAM = 'range'

/** Resolve a stored value string against the presets; unknown -> default. */
function resolveTimeRange(value: string | null): TimeRangeOption {
  if (!value) return DEFAULT_TIME_RANGE
  return TIME_RANGE_PRESETS.find((p) => p.value === value) ?? DEFAULT_TIME_RANGE
}

/**
 * Read the initial time range, preferring the URL `?range=` param, falling
 * back to localStorage, then the default. Wrapped in try/catch for SSR and
 * private-browsing safety.
 */
function readInitialTimeRange(): TimeRangeOption {
  if (typeof window === 'undefined') return DEFAULT_TIME_RANGE
  try {
    const fromUrl = new URLSearchParams(window.location.search).get(
      SEARCH_PARAM
    )
    if (fromUrl) return resolveTimeRange(fromUrl)
    return resolveTimeRange(localStorage.getItem(STORAGE_KEY))
  } catch {
    return DEFAULT_TIME_RANGE
  }
}

/** Persist the selected range to localStorage and the URL search param. */
function persistTimeRange(option: TimeRangeOption): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, option.value)
  } catch {
    // localStorage may be full or unavailable (e.g. private browsing)
  }
  try {
    const url = new URL(window.location.href)
    url.searchParams.set(SEARCH_PARAM, option.value)
    window.history.replaceState(window.history.state, '', url.toString())
  } catch {
    // history API may be unavailable in some embedded contexts
  }
}

interface TimeRangeContextValue {
  timeRange: TimeRangeOption
  setTimeRange: (option: TimeRangeOption) => void
  presets: TimeRangeOption[]
}

const TimeRangeContext = createContext<TimeRangeContextValue>({
  timeRange: DEFAULT_TIME_RANGE,
  setTimeRange: () => {},
  presets: TIME_RANGE_PRESETS,
})

export function TimeRangeProvider({ children }: { children: React.ReactNode }) {
  const [timeRange, setTimeRangeState] =
    useState<TimeRangeOption>(readInitialTimeRange)

  const setTimeRange = (option: TimeRangeOption) => {
    setTimeRangeState(option)
    persistTimeRange(option)
  }

  const value = { timeRange, setTimeRange, presets: TIME_RANGE_PRESETS }

  return (
    <TimeRangeContext.Provider value={value}>
      {children}
    </TimeRangeContext.Provider>
  )
}

export function useTimeRange(): TimeRangeContextValue {
  return use(TimeRangeContext)
}
