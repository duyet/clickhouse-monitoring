/**
 * Data transformation utilities for ClickHouse responses
 *
 * ClickHouse returns large numbers as strings to preserve precision.
 * This module provides utilities to convert numeric strings to numbers
 * for chart rendering and other use cases.
 */

/**
 * Check if a string value represents a numeric value
 * Handles integers, floats, negative numbers, and scientific notation
 */
function isNumericString(value: string): boolean {
  if (value === '' || value === null || value === undefined) return false
  // Match integers, floats, negative numbers, and scientific notation
  // Also handles UInt64/Int64 large numbers from ClickHouse
  return /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(value)
}

/**
 * Safely convert a numeric string to a number
 * Returns the original string if conversion would lose precision
 */
function safeParseNumber(value: string): number | string {
  const num = Number(value)
  // Check for precision loss with large integers
  // JavaScript can safely represent integers up to 2^53 - 1
  if (Number.isInteger(num) && Math.abs(num) > Number.MAX_SAFE_INTEGER) {
    return value // Keep as string to preserve precision
  }
  return num
}

/**
 * Transform a single value, converting numeric strings to numbers
 */
function transformValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value
  }

  if (typeof value === 'string' && isNumericString(value)) {
    return safeParseNumber(value)
  }

  if (Array.isArray(value)) {
    return value.map(transformValue)
  }

  if (typeof value === 'object') {
    return transformRecord(value as Record<string, unknown>)
  }

  return value
}

/**
 * Transform a record, converting numeric string values to numbers
 */
function transformRecord(
  record: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(record)) {
    result[key] = transformValue(value)
  }

  return result
}

/**
 * Transform ClickHouse JSON data to convert numeric strings to numbers
 *
 * This is necessary because ClickHouse returns numbers as strings in JSON
 * format to preserve precision for large integers (UInt64/Int64).
 *
 * @param data - Array of records from ClickHouse
 * @returns Transformed array with numeric strings converted to numbers
 *
 * @example
 * ```typescript
 * // Input from ClickHouse
 * const data = [
 *   { event_time: "2025-01-01", query_count: "12345" },
 *   { event_time: "2025-01-02", query_count: "67890" }
 * ]
 *
 * // Output after transformation
 * const transformed = transformClickHouseData(data)
 * // [
 * //   { event_time: "2025-01-01", query_count: 12345 },
 * //   { event_time: "2025-01-02", query_count: 67890 }
 * // ]
 * ```
 */
export function transformClickHouseData<T extends Record<string, unknown>>(
  data: T[]
): T[] {
  if (!Array.isArray(data)) {
    return data
  }

  return data.map((record) => transformRecord(record) as T)
}
