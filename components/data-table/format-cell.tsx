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
  formatCell,
  getInlineFormatter,
  getValueFormatter,
  getContextFormatter,
  getAdvancedFormatter,
  hasInlineFormatter,
  hasValueFormatter,
  hasContextFormatter,
  hasAdvancedFormatter,
  FORMATTER_REGISTRY,
  // Re-export all individual formatters
  codeFormatter,
  numberFormatter,
  numberShortFormatter,
  badgeFormatter,
  booleanFormatter,
  durationFormatter,
  relatedTimeFormatter,
  textFormatter,
  actionFormatter,
  linkFormatter,
  backgroundBarFormatter,
  hoverCardFormatter,
  codeDialogFormatter,
  codeToggleFormatter,
  markdownFormatter,
  coloredBadgeFormatter,
  // Types
  type Formatter,
  type FormatterEntry,
  type FormatterLookupResult,
  type FormatterProps,
  type InlineFormatter,
  type RowContextFormatter,
  type ValueOnlyFormatter,
} from './formatters'
