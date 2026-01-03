'use client'

import type { Column, Row } from '@tanstack/react-table'

import { useCallback, useMemo, useRef } from 'react'

/**
 * Result from auto-fitting a column
 */
interface AutoFitResult {
  columnId: string
  fittedWidth: number
}

/**
 * Configuration for auto-fit behavior
 */
interface AutoFitOptions {
  /** Minimum column width in pixels (default: 50) */
  minWidth?: number
  /** Maximum column width in pixels (default: 500) */
  maxWidth?: number
  /** Padding to add to fitted width (default: 16) */
  padding?: number
  /** Header text included in calculation (default: true) */
  includeHeader?: boolean
  /** Max rows to sample for performance (default: 100) */
  maxSampleRows?: number
}

const DEFAULT_OPTIONS: Required<AutoFitOptions> = {
  minWidth: 50,
  maxWidth: 500,
  padding: 16,
  includeHeader: true,
  maxSampleRows: 100,
}

/**
 * useAutoFitColumns - Hook for calculating and setting column widths based on content
 *
 * Measures actual rendered content width by creating a temporary element
 * and applying the same styles as table cells. Uses sampling for performance
 * with large datasets.
 *
 * @param tableRef - Reference to the table container (for style context)
 * @returns Function to auto-fit a column to its content
 */
export function useAutoFitColumns<TData>(
  _tableRef: React.RefObject<HTMLDivElement>,
  options: AutoFitOptions = {}
) {
  const opts = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options])
  const measureCache = useRef<Map<string, number>>(new Map())

  /**
   * Measure text width using a temporary element with table cell styles
   */
  const measureTextWidth = useCallback((text: string): number => {
    const cacheKey = text
    if (measureCache.current.has(cacheKey)) {
      return measureCache.current.get(cacheKey)!
    }

    // Create temporary element for measurement
    const measureEl = document.createElement('div')
    measureEl.style.position = 'absolute'
    measureEl.style.visibility = 'hidden'
    measureEl.style.height = '0'
    measureEl.style.overflow = 'hidden'
    measureEl.style.whiteSpace = 'nowrap'
    measureEl.style.padding = '16px' // Matches px-4 in table cells
    measureEl.style.fontSize = '12px' // Match table font size
    measureEl.style.fontWeight = 'normal'
    measureEl.textContent = text

    document.body.appendChild(measureEl)
    const width = measureEl.offsetWidth
    document.body.removeChild(measureEl)

    measureCache.current.set(cacheKey, width)
    return width
  }, [])

  /**
   * Auto-fit a single column to its content width
   */
  const autoFitColumn = useCallback(
    (
      column: Column<TData, unknown>,
      rows: Row<TData>[],
      headerText?: string
    ): AutoFitResult => {
      let maxContentWidth =
        headerText && opts.includeHeader ? measureTextWidth(headerText) : 0

      // Sample rows for performance with large datasets
      const sampleSize = Math.min(rows.length, opts.maxSampleRows)
      const step =
        rows.length > sampleSize ? Math.floor(rows.length / sampleSize) : 1

      for (let i = 0; i < rows.length; i += step) {
        const row = rows[i]
        const cellValue = row.getValue(column.id)

        if (cellValue != null) {
          const text = String(cellValue)
          const cellWidth = measureTextWidth(text)
          maxContentWidth = Math.max(maxContentWidth, cellWidth)
        }
      }

      // Apply bounds and padding
      const fittedWidth = Math.min(
        opts.maxWidth,
        Math.max(opts.minWidth, maxContentWidth + opts.padding)
      )

      // Set the column size
      column.resetSize() // First reset to clear any manual sizing
      column.columnDef.size = fittedWidth

      return {
        columnId: column.id,
        fittedWidth,
      }
    },
    [measureTextWidth, opts]
  )

  /**
   * Auto-fit all columns to their content
   */
  const autoFitAllColumns = useCallback(
    (
      columns: Column<TData, unknown>[],
      rows: Row<TData>[]
    ): AutoFitResult[] => {
      return columns.map((column) => {
        const headerText = column.columnDef.header as string
        return autoFitColumn(column, rows, headerText)
      })
    },
    [autoFitColumn]
  )

  // Clear cache when component unmounts
  const clearCache = useCallback(() => {
    measureCache.current.clear()
  }, [])

  return {
    autoFitColumn,
    autoFitAllColumns,
    clearCache,
  }
}
