/**
 * Format Cell Module
 *
 * @deprecated This file is kept for backward compatibility.
 * Import formatCell directly from @/components/data-table/formatters instead.
 *
 * @example
 * ```tsx
 * // Old import (still works but deprecated)
 * import { formatCell } from '@/components/data-table/format-cell'
 *
 * // New import (recommended)
 * import { formatCell } from '@/components/data-table/formatters'
 * ```
 */

// Re-export everything from the formatters module
export {
  actionFormatter,
  backgroundBarFormatter,
  badgeFormatter,
  booleanFormatter,
  codeDialogFormatter,
  // Re-export all individual formatters
  codeFormatter,
  codeToggleFormatter,
  coloredBadgeFormatter,
  durationFormatter,
  FORMATTER_REGISTRY,
  // Types
  type Formatter,
  type FormatterEntry,
  type FormatterLookupResult,
  type FormatterProps,
  formatCell,
  getAdvancedFormatter,
  getContextFormatter,
  getInlineFormatter,
  getValueFormatter,
  hasAdvancedFormatter,
  hasContextFormatter,
  hasInlineFormatter,
  hasValueFormatter,
  hoverCardFormatter,
  type InlineFormatter,
  linkFormatter,
  markdownFormatter,
  numberFormatter,
  numberShortFormatter,
  type RowContextFormatter,
  relatedTimeFormatter,
  textFormatter,
  type ValueOnlyFormatter,
} from './formatters'
