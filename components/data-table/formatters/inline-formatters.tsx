import type { InlineFormatter } from './types'

import { formatReadableQuantity } from '@/lib/format-readable'
import { ColumnFormat } from '@/types/column-format'

/**
 * Code formatter - wraps value in <code> tag
 *
 * @example
 * ```tsx
 * <code>user_id</code>
 * ```
 */
export const codeFormatter: InlineFormatter = (value) => (
  <code>{value as string}</code>
)

/**
 * Number formatter - formats number with readable quantity (long format)
 * Displays centered, non-wrapping text
 *
 * @example
 * ```tsx
 * <span className="text-center text-nowrap">1.23M</span>
 * ```
 */
export const numberFormatter: InlineFormatter = (value) => (
  <span className="text-center text-nowrap">
    {formatReadableQuantity(value as number, 'long')}
  </span>
)

/**
 * Number short formatter - formats number with readable quantity (short format)
 * Returns just the formatted number without wrapper
 *
 * @example
 * ```tsx
 * 1.23M
 * ```
 */
export const numberShortFormatter: InlineFormatter = (value) =>
  formatReadableQuantity(value as number, 'short')

/**
 * Registry of inline formatters
 * These are simple, pure functions that transform values without needing context
 */
export const INLINE_FORMATTERS: Record<
  ColumnFormat.Code | ColumnFormat.Number | ColumnFormat.NumberShort,
  InlineFormatter
> = {
  [ColumnFormat.Code]: codeFormatter,
  [ColumnFormat.Number]: numberFormatter,
  [ColumnFormat.NumberShort]: numberShortFormatter,
} as const
