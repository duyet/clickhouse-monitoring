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
    return `toDate(${interval}(${column})) as ${alias || column}`
  }

  return `${interval}(${column}) as ${alias || column}`
}
