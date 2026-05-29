export const VALID_INTERVALS = [
  'toStartOfMinute',
  'toStartOfFiveMinutes',
  'toStartOfTenMinutes',
  'toStartOfFifteenMinutes',
  'toStartOfHour',
  'toStartOfDay',
  'toStartOfWeek',
  'toStartOfMonth',
] as const

export type ClickHouseInterval = (typeof VALID_INTERVALS)[number]

export function isValidInterval(value: string): value is ClickHouseInterval {
  return (VALID_INTERVALS as readonly string[]).includes(value)
}
