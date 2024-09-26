import type { ClickHouseInterval } from '@/types/clickhouse-interval'

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

export function fillStep(interval: ClickHouseInterval) {
  switch (interval) {
    case 'toStartOfMinute':
      return 'toIntervalMinute(1)'
    case 'toStartOfFiveMinutes':
      return 'toIntervalMinute(5)'
    case 'toStartOfTenMinutes':
      return 'toIntervalMinute(10)'
    case 'toStartOfFifteenMinutes':
      return 'toIntervalMinute(15)'
    case 'toStartOfHour':
      return 'toIntervalHour(1)'
    case 'toStartOfDay':
      return 'toIntervalDay(1)'
    case 'toStartOfWeek':
      return 'toIntervalDay(7)'
    case 'toStartOfMonth':
      return 'toIntervalMonth(1)'
  }
}

export function nowOrToday(interval: ClickHouseInterval) {
  switch (interval) {
    case 'toStartOfMinute':
    case 'toStartOfFiveMinutes':
    case 'toStartOfTenMinutes':
    case 'toStartOfFifteenMinutes':
    case 'toStartOfHour':
      return 'now()'
    case 'toStartOfDay':
    case 'toStartOfWeek':
    case 'toStartOfMonth':
      return 'today()'
  }
}
