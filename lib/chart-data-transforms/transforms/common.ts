/**
 * Common helper functions for chart data transformations.
 *
 * These utilities are shared across multiple transform modules to avoid
 * code duplication and ensure consistent behavior.
 */

import type { ReadWritePair, SummaryMetricsItem } from '../types'

/**
 * Safely extracts and validates nested data from API response.
 *
 * This helper is useful when API responses contain nested arrays within
 * the first object of a response array. It safely extracts the nested data
 * with proper type checking.
 *
 * @param data - Raw API response (potentially array of unknown objects)
 * @param key - Key to extract from the first item
 * @returns Extracted array or undefined
 *
 * @example
 * ```ts
 * const response = [{ used: [...] }, { totalMem: [...] }]
 * const used = extractNestedData<UsedType>(response, 'used')
 * // used = [...]
 * ```
 */
export function extractNestedData<T>(
  data: unknown[] | undefined,
  key: string
): T[] | undefined {
  const firstItem = data?.[0] as Record<string, unknown> | undefined
  if (!firstItem || typeof firstItem !== 'object') {
    return undefined
  }

  const nested = firstItem[key]
  return Array.isArray(nested) ? (nested as T[]) : undefined
}

/**
 * Formats a read/write pair for display, ensuring smaller value is shown first.
 *
 * This helper ensures consistent visual presentation in comparison displays
 * by always placing the smaller value as the "current" value and the larger
 * as the "target" value.
 *
 * @param read - Read value and readable string
 * @param write - Write value and readable string
 * @param unit - Unit suffix for display (optional)
 * @returns Formatted comparison item with smaller value first
 *
 * @example
 * ```ts
 * const result = formatReadWritePair(
 *   { value: 100, readable: '100' },
 *   { value: 200, readable: '200' },
 *   'bytes'
 * )
 * // result.current = 100, result.currentReadable = '100 bytes read'
 * // result.target = 200, result.targetReadable = '200 bytes written'
 * ```
 */
export function formatReadWritePair(
  read: ReadWritePair,
  write: ReadWritePair,
  unit: string = ''
): SummaryMetricsItem {
  const isReadSmaller = read.value < write.value
  const unitPrefix = unit ? `${unit} ` : ''

  if (isReadSmaller) {
    return {
      current: read.value,
      target: write.value,
      currentReadable: `${read.readable} ${unitPrefix}read`.trim(),
      targetReadable: `${write.readable} ${unitPrefix}written`.trim(),
    }
  } else {
    return {
      current: write.value,
      target: read.value,
      currentReadable: `${write.readable} ${unitPrefix}written`.trim(),
      targetReadable: `${read.readable} ${unitPrefix}read`.trim(),
    }
  }
}
