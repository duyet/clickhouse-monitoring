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

export function withQueryParams(
  query: string,
  params?: Record<string, string | number>
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
      return `SET param_${key}=${value}`
    })
    .join(';\n')

  return `${setParams};\n${dedent(query)}`
}
