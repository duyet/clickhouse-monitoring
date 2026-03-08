'use client'

import type { ClickHouseInterval } from '@/types/clickhouse-interval'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

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
    useState<TimeRangeOption>(DEFAULT_TIME_RANGE)

  const setTimeRange = useCallback((option: TimeRangeOption) => {
    setTimeRangeState(option)
  }, [])

  const value = useMemo(
    () => ({ timeRange, setTimeRange, presets: TIME_RANGE_PRESETS }),
    [timeRange, setTimeRange]
  )

  return (
    <TimeRangeContext.Provider value={value}>
      {children}
    </TimeRangeContext.Provider>
  )
}

export function useTimeRange(): TimeRangeContextValue {
  return useContext(TimeRangeContext)
}
