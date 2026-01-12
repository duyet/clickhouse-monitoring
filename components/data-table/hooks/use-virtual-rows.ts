'use client'

import { useVirtualizer } from '@tanstack/react-virtual'

import { type RefObject, useRef } from 'react'

/**
 * Hook for virtualizing table rows to improve performance with large datasets.
 * Automatically enables when row count exceeds threshold.
 *
 * @param rowCount - Total number of rows to virtualize
 * @param options - Virtualizer configuration options
 * @returns Virtual row configuration and ref
 *
 * @example
 * ```tsx
 * const { virtualizer, tableContainerRef } = useVirtualRows(rows.length)
 *
 * // Get virtual items to render:
 * const virtualRows = virtualizer.getVirtualItems()
 * virtualRows.map((virtualRow) => {
 *   const row = rows[virtualRow.index]
 *   // render row with: style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
 * })
 * ```
 */
export interface UseVirtualRowsOptions {
  /** Estimated row height in pixels (default: 40) */
  estimateSize?: number
  /** Number of rows to render outside viewport (default: 10) */
  overscan?: number
  /** Row count threshold to enable virtualization (default: 1000) */
  virtualizeThreshold?: number
}

export interface UseVirtualRowsResult {
  /** The virtualizer instance from @tanstack/react-virtual */
  virtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, Element>> | null
  /** Ref to attach to the scroll container element */
  tableContainerRef: RefObject<HTMLDivElement | null>
  /** Whether virtualization is enabled */
  isVirtualized: boolean
}

export function useVirtualRows(
  rowCount: number,
  options: UseVirtualRowsOptions = {}
): UseVirtualRowsResult {
  const {
    estimateSize = 40,
    overscan = 10,
    virtualizeThreshold = 1000,
  } = options

  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Auto-enable virtualization for large datasets
  const shouldVirtualize = rowCount >= virtualizeThreshold

  const virtualizer = useVirtualizer<HTMLDivElement, Element>({
    count: rowCount,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => estimateSize,
    overscan,
    enabled: shouldVirtualize,
  })

  return {
    virtualizer: shouldVirtualize ? virtualizer : null,
    tableContainerRef,
    isVirtualized: shouldVirtualize,
  }
}
