import type { ClickHouseInterval } from '@/types/clickhouse-interval'

import dedent from 'dedent'

export function applyInterval(
  interval: ClickHouseInterval,
  column: string,
  alias?: string
) {
  if (
    interval === 'toStartOfMonth' ||
    interval === 'toStartOfWeek' ||
    interval === 'toStartOfDay'
  ) {
    return `toDate(${interval}(${column})) AS ${alias || column}`
  }

  return `${interval}(${column}) AS ${alias || column}`
}

// prettier-ignore
const intervalMap = new Map<
  ClickHouseInterval,
  { fillStep: string; nowOrToday: string }
>([
  ['toStartOfMinute', { fillStep: 'toIntervalMinute(1)', nowOrToday: 'now()' }],
  [
    'toStartOfFiveMinutes',
    { fillStep: 'toIntervalMinute(5)', nowOrToday: 'now()' },
  ],
  [
    'toStartOfTenMinutes',
    { fillStep: 'toIntervalMinute(10)', nowOrToday: 'now()' },
  ],
  [
    'toStartOfFifteenMinutes',
    { fillStep: 'toIntervalMinute(15)', nowOrToday: 'now()' },
  ],
  ['toStartOfHour', { fillStep: 'toIntervalHour(1)', nowOrToday: 'now()' }],
  ['toStartOfDay', { fillStep: 'toIntervalDay(1)', nowOrToday: 'today()' }],
  ['toStartOfWeek', { fillStep: 'toIntervalDay(7)', nowOrToday: 'today()' }],
  ['toStartOfMonth', { fillStep: 'toIntervalMonth(1)', nowOrToday: 'today()' }],
])

export function fillStep(interval: ClickHouseInterval): string {
  return intervalMap.get(interval)?.fillStep ?? ''
}

export function nowOrToday(interval: ClickHouseInterval): string {
  return intervalMap.get(interval)?.nowOrToday ?? ''
}

/**
 * Build a time filter condition for ClickHouse queries.
 * Returns empty string when lastHours is undefined (no time filter).
 *
 * @param lastHours - Number of hours to look back, or undefined for "all" data
 * @param column - Column name to filter on (default: 'event_time')
 * @returns SQL WHERE clause condition (without "WHERE" keyword)
 *
 * @example
 * buildTimeFilter(24) // "event_time >= (now() - INTERVAL 24 HOUR)"
 * buildTimeFilter(24, 'query_start_time') // "query_start_time >= (now() - INTERVAL 24 HOUR)"
 * buildTimeFilter(undefined) // "" (no filter)
 */
export function buildTimeFilter(
  lastHours: number | undefined,
  column: string = 'event_time'
): string {
  if (lastHours === undefined) {
    return '' // No time filter for "all" range
  }
  return `${column} >= (now() - INTERVAL ${lastHours} HOUR)`
}

/**
 * Build a time filter condition using toIntervalHour.
 * Alternative to buildTimeFilter() for queries that use toIntervalHour().
 *
 * @param lastHours - Number of hours to look back, or undefined for "all" data
 * @param column - Column name to filter on (default: 'event_time')
 * @returns SQL WHERE clause condition (without "WHERE" keyword)
 *
 * @example
 * buildTimeFilterInterval(24) // "event_time >= (now() - toIntervalHour(24))"
 * buildTimeFilterInterval(undefined) // "" (no filter)
 */
export function buildTimeFilterInterval(
  lastHours: number | undefined,
  column: string = 'event_time'
): string {
  if (lastHours === undefined) {
    return '' // No time filter for "all" range
  }
  return `${column} >= (now() - toIntervalHour(${lastHours}))`
}

export function withQueryParams(
  query: string,
  params?: Record<string, unknown>
) {
  if (!params || Object.keys(params).length === 0) {
    return query
  }

  const setParams = Object.entries(params)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        // Escape single quotes by doubling them
        const escapedValue = value.replace(/'/g, "''")
        return `SET param_${key}='${escapedValue}'`
      }
      if (typeof value === 'boolean') {
        return `SET param_${key}=${value ? 1 : 0}`
      }
      return `SET param_${key}=${value}`
    })
    .join(';\n')

  return `${setParams};\n${dedent(query)}`
}
