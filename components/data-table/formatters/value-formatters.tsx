import type { ColumnFormatOptions } from '@/types/column-format'
import { ColumnFormat } from '@/types/column-format'

import { BadgeFormat } from '../cells/badge-format'
import { BooleanFormat } from '../cells/boolean-format'
import { DurationFormat } from '../cells/duration-format'
import { RelatedTimeFormat } from '../cells/related-time-format'
import type { TextFormatOptions } from '../cells/text-format'
import { TextFormat } from '../cells/text-format'

import type { ValueOnlyFormatter } from './types'

/**
 * Badge formatter - wraps value in a styled badge component
 *
 * @example
 * ```tsx
 * <BadgeFormat value="completed" />
 * ```
 */
export const badgeFormatter: ValueOnlyFormatter = (value) => (
  <BadgeFormat value={value as React.ReactNode} />
)

/**
 * Boolean formatter - displays boolean values as check/cross icons
 *
 * @example
 * ```tsx
 * <BooleanFormat value={true} />  // CheckCircledIcon
 * <BooleanFormat value={false} /> // CrossCircledIcon
 * ```
 */
export const booleanFormatter: ValueOnlyFormatter = (value) => (
  <BooleanFormat value={value as string | number | boolean} />
)

/**
 * Duration formatter - converts seconds to human-readable duration
 *
 * @example
 * ```tsx
 * <DurationFormat value={123} /> // "2 minutes"
 * ```
 */
export const durationFormatter: ValueOnlyFormatter = (value) => (
  <DurationFormat value={value as string | number} />
)

/**
 * Related time formatter - displays datetime as relative time
 *
 * @example
 * ```tsx
 * <RelatedTimeFormat value="2024-01-01 12:00:00" /> // "2 hours ago"
 * ```
 */
export const relatedTimeFormatter: ValueOnlyFormatter = (value) => (
  <RelatedTimeFormat value={value as string} />
)

/**
 * Text formatter - displays text with optional truncation and styling
 *
 * @example
 * ```tsx
 * <TextFormat value="long text..." options={{ truncate: 50 }} />
 * ```
 */
export const textFormatter: ValueOnlyFormatter = (value, options) => (
  <TextFormat value={value as React.ReactNode} options={options as TextFormatOptions} />
)

/**
 * Registry of value-only formatters
 * These formatters only need the value (and optionally options) to render
 */
export const VALUE_FORMATTERS: Record<
  | ColumnFormat.Badge
  | ColumnFormat.Boolean
  | ColumnFormat.Duration
  | ColumnFormat.RelatedTime
  | ColumnFormat.Text,
  ValueOnlyFormatter
> = {
  [ColumnFormat.Badge]: badgeFormatter,
  [ColumnFormat.Boolean]: booleanFormatter,
  [ColumnFormat.Duration]: durationFormatter,
  [ColumnFormat.RelatedTime]: relatedTimeFormatter,
  [ColumnFormat.Text]: textFormatter,
} as const
