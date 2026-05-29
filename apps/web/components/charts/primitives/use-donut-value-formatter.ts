/**
 * Custom hook for donut chart value formatting
 *
 * Extracted from donut.tsx for better separation of concerns.
 */

'use client'

import { useMemo } from 'react'
import { formatBytes, formatCount, formatDuration } from '@/lib/utils'

export type ReadableFormat = 'bytes' | 'duration' | 'number' | 'quantity'

export interface UseDonutValueFormatterOptions {
  valueFormatter?: (value: number) => string
  readable?: ReadableFormat
  readableColumn?: string
  data: Record<string, unknown>[]
  valueKey: string
}

/**
 * Custom hook for creating a value formatter for donut charts
 *
 * Supports multiple formatting strategies:
 * 1. Custom formatter function
 * 2. Readable format with a dedicated column
 * 3. Readable format applied to the value itself
 * 4. Default number formatting
 */
export function useDonutValueFormatter({
  valueFormatter,
  readable,
  readableColumn,
  data,
  valueKey,
}: UseDonutValueFormatterOptions) {
  return useMemo(() => {
    // Use custom formatter if provided
    if (valueFormatter) return valueFormatter

    // No readable format specified - use default number formatting
    if (!readable || !readableColumn) {
      return (value: number) => value.toLocaleString()
    }

    // Create formatter that looks up readable column values
    return (value: number) => {
      // Find the data row that matches this value
      const row = data.find((d) => Number(d[valueKey]) === value)

      // If we found a row with a readable column, format that value
      if (row && readableColumn in row) {
        const readableValue = row[readableColumn]
        if (typeof readableValue === 'number') {
          return formatReadableValue(readableValue, readable)
        }
        return String(readableValue)
      }

      // Otherwise, format the value itself
      return formatReadableValue(value, readable)
    }
  }, [valueFormatter, readable, readableColumn, data, valueKey])
}

/**
 * Format a value according to the readable format type
 */
function formatReadableValue(value: number, format: ReadableFormat): string {
  switch (format) {
    case 'bytes':
      return formatBytes(value)
    case 'duration':
      return formatDuration(value)
    case 'number':
    case 'quantity':
      return formatCount(value)
    default:
      return value.toLocaleString()
  }
}
