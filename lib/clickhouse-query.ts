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
    return `toDate(toStartOfDay(${column})) as ${alias || column}`
  }

  return `toStartOfHour(${column}) as ${alias || column}`
}
