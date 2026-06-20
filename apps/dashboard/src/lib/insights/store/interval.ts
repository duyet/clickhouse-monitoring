/**
 * Shared "since" interval handling for the non-ClickHouse insight backends.
 *
 * The findings API expresses recency windows as ClickHouse interval strings
 * ("6 HOUR", "1 DAY"). ClickHouse evaluates these natively; the SQL (D1 /
 * Postgres) and in-memory backends need to translate them to a millisecond
 * cutoff. Keeping this in one place ensures every backend honors the same
 * grammar and rejects the same malformed input (defense in depth — the value
 * also flows through `sanitizeSince` on the ClickHouse path).
 */

const UNIT_MS: Record<string, number> = {
  SECOND: 1000,
  MINUTE: 60_000,
  HOUR: 3_600_000,
  DAY: 86_400_000,
  WEEK: 604_800_000,
  MONTH: 2_592_000_000, // 30 days, matching the findings-table TTL granularity
}

/**
 * Parse a ClickHouse interval expression ("24 HOUR") into milliseconds.
 * Returns null when the expression is invalid so callers can skip the filter.
 */
export function intervalToMs(value: string): number | null {
  const match = value
    .trim()
    .toUpperCase()
    .match(/^(\d{1,5})\s+(SECOND|MINUTE|HOUR|DAY|WEEK|MONTH)S?$/)
  if (!match) return null
  return Number(match[1]) * UNIT_MS[match[2]]
}
