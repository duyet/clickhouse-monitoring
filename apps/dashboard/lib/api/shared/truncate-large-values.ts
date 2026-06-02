/**
 * Truncate large string values in result rows to prevent browser OOM.
 *
 * ClickHouse tables can contain very large text/JSON columns that, when
 * serialized as JSON, create responses too large for the browser to parse.
 * Any string value longer than `MAX_CELL_VALUE_LENGTH` is sliced and tagged
 * with the original length so the UI can communicate that truncation occurred.
 */

export const MAX_CELL_VALUE_LENGTH = 10_000

function isPlainRow(row: unknown): row is Record<string, unknown> {
  return typeof row === 'object' && row !== null && !Array.isArray(row)
}

export function truncateLargeValues<T>(
  data: T,
  maxLength: number = MAX_CELL_VALUE_LENGTH
): T {
  if (!Array.isArray(data)) return data

  return data.map((row) => {
    if (!isPlainRow(row)) return row
    const truncatedRow: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === 'string' && value.length > maxLength) {
        truncatedRow[key] =
          value.slice(0, maxLength) +
          `… (truncated, ${value.length} chars total)`
      } else {
        truncatedRow[key] = value
      }
    }
    return truncatedRow
  }) as T
}
