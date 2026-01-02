import type { ClickHouseInterval } from '@/types/clickhouse-interval'

/**
 * A single date range option for the selector
 */
export interface DateRangeOption {
  /** Display label (e.g., "24h", "7d") */
  label: string
  /** Unique value identifier */
  value: string
  /** Number of hours of historical data (undefined for "all" data) */
  lastHours?: number
  /** Recommended interval granularity for this range */
  interval: ClickHouseInterval
  /** Optional description for tooltip */
  description?: string
}

/**
 * Configuration for a chart's available date ranges
 */
export interface DateRangeConfig {
  /** Available range options */
  options: DateRangeOption[]
  /** Default selected value */
  defaultValue: string
}

/**
 * Current date range selection state
 */
export interface DateRangeValue {
  /** Current value identifier (e.g., "24h") */
  value: string
  /** Number of hours (undefined for "all" data) */
  lastHours?: number
  /** Interval granularity */
  interval: ClickHouseInterval
}
