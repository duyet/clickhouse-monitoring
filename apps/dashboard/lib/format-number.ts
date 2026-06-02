/**
 * Number formatting utilities with cached Intl.NumberFormat instances.
 *
 * Formatters are created once at module scope to avoid per-call allocation.
 */

/** Cached compact formatter (browser locale, 1 decimal) */
const COMPACT_FORMAT = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** Cached plain number formatter (browser locale) */
const PLAIN_FORMAT = new Intl.NumberFormat()

/**
 * Format a number using compact notation for large values.
 * e.g., 1234567 → "1.2M", 45678 → "45.7K", 123 → "123"
 */
export function formatCompactNumber(value: number): string {
  if (Math.abs(value) < 1000) return value.toLocaleString()
  return COMPACT_FORMAT.format(value)
}

/**
 * Format a number with locale-aware grouping (e.g., 1,234,567).
 * Uses a cached formatter to avoid per-call allocation.
 */
export function formatNumber(value: number): string {
  return PLAIN_FORMAT.format(value)
}
