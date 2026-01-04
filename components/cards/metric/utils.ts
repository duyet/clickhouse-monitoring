import type { MetricListItem } from './types'

/**
 * Extracts a value from data or uses a provided value
 *
 * @param value - A static value or a function that extracts value from data
 * @param data - The data array to extract from
 * @returns The extracted value or '-' as fallback
 */
export function extractValue<T>(
  value: string | number | ((data: T[]) => string | number) | undefined,
  data: T[]
): string | number {
  if (typeof value === 'function') return value(data)
  return value ?? '-'
}

/**
 * Extracts items list from data or uses a provided list
 *
 * @param items - A static list or a function that extracts list from data
 * @param data - The data array to extract from
 * @returns The extracted list or empty array as fallback
 */
export function extractItems<T>(
  items: MetricListItem[] | ((data: T[]) => MetricListItem[]) | undefined,
  data: T[]
): MetricListItem[] {
  if (typeof items === 'function') return items(data)
  return items ?? []
}
