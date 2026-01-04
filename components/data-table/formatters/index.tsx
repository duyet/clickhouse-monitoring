/**
 * Formatters Module
 *
 * Provides a centralized registry for all cell formatters used in data tables.
 * Formatters are organized by complexity:
 * - Inline: Simple value transformations (no context needed)
 * - Value: Component formatters that only need value + options
 * - Context: Formatters requiring row/table context
 * - Advanced: Complex formatters with special behaviors
 *
 * @module formatters
 */

import { ADVANCED_FORMATTERS } from './advanced-formatters'
import { CONTEXT_FORMATTERS } from './context-formatters'
import { INLINE_FORMATTERS } from './inline-formatters'
import { VALUE_FORMATTERS } from './value-formatters'

export type {
  Formatter,
  FormatterEntry,
  FormatterLookupResult,
  FormatterProps,
  InlineFormatter,
  RowContextFormatter,
  ValueOnlyFormatter,
} from './types'

/**
 * Master formatter registry combining all formatter types
 */
export const FORMATTER_REGISTRY = {
  inline: INLINE_FORMATTERS,
  value: VALUE_FORMATTERS,
  context: CONTEXT_FORMATTERS,
  advanced: ADVANCED_FORMATTERS,
} as const

// Re-export all formatters for direct access if needed
export * from './advanced-formatters'
export * from './context-formatters'
// Export core formatting function
export { formatCell } from './format-cell'
// Export formatter utilities
export {
  getAdvancedFormatter,
  getContextFormatter,
  getInlineFormatter,
  getValueFormatter,
} from './formatter-lookup'
export {
  getSupportedFormats,
  hasAdvancedFormatter,
  hasContextFormatter,
  hasFormatter,
  hasInlineFormatter,
  hasValueFormatter,
} from './formatter-selector'
export * from './inline-formatters'
export * from './value-formatters'
