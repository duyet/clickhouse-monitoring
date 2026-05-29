const UNIT_SHORT: Record<string, string> = {
  year: 'y',
  month: 'mo',
  week: 'w',
  day: 'd',
  hour: 'h',
  minute: 'm',
  second: 's',
}

/**
 * Compact a ClickHouse `formatReadableTimeDelta` string into a short label.
 * Examples:
 *   "4 days, 14 hours, 31 minutes and 52 seconds" -> "4d 14h"
 *   "2 hours and 5 minutes"                       -> "2h 5m"
 *   "45 seconds"                                  -> "45s"
 */
export function formatCompactUptime(input: string, maxParts = 2): string {
  if (!input) return ''
  const parts: string[] = []
  const re = /(\d+)\s+(year|month|week|day|hour|minute|second)s?/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(input)) !== null) {
    const [, value, unit] = match
    const short = UNIT_SHORT[unit.toLowerCase()]
    if (!short) continue
    parts.push(`${value}${short}`)
    if (parts.length >= maxParts) break
  }
  return parts.length > 0 ? parts.join(' ') : input
}
