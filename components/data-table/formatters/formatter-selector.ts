/**
 * Formatter selector utilities
 *
 * Provides lookup and validation functions for formatter types.
 */

import { ColumnFormat } from '@/types/column-format'
import { ADVANCED_FORMATTERS } from './advanced-formatters'
import { CONTEXT_FORMATTERS } from './context-formatters'
import { INLINE_FORMATTERS } from './inline-formatters'
import { VALUE_FORMATTERS } from './value-formatters'

/**
 * Check if a format type has an inline formatter
 */
export function hasInlineFormatter(format: ColumnFormat): boolean {
  return format in INLINE_FORMATTERS
}

/**
 * Check if a format type has a value-only formatter
 */
export function hasValueFormatter(format: ColumnFormat): boolean {
  return format in VALUE_FORMATTERS
}

/**
 * Check if a format type has a context formatter
 */
export function hasContextFormatter(format: ColumnFormat): boolean {
  return format in CONTEXT_FORMATTERS
}

/**
 * Check if a format type has an advanced formatter
 */
export function hasAdvancedFormatter(format: ColumnFormat): boolean {
  return format in ADVANCED_FORMATTERS
}

/**
 * Get all format types that have formatters
 */
export function getSupportedFormats(): ColumnFormat[] {
  const inlineFormats = Object.keys(INLINE_FORMATTERS) as ColumnFormat[]
  const valueFormats = Object.keys(VALUE_FORMATTERS) as ColumnFormat[]
  const contextFormats = Object.keys(CONTEXT_FORMATTERS) as ColumnFormat[]
  const advancedFormats = Object.keys(ADVANCED_FORMATTERS) as ColumnFormat[]

  return [...new Set([...inlineFormats, ...valueFormats, ...contextFormats, ...advancedFormats])]
}

/**
 * Check if any formatter exists for the given format type
 */
export function hasFormatter(format: ColumnFormat): boolean {
  return (
    hasInlineFormatter(format) ||
    hasValueFormatter(format) ||
    hasContextFormatter(format) ||
    hasAdvancedFormatter(format)
  )
}
