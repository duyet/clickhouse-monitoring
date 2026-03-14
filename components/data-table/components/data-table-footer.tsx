'use client'

import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import type { RowData, Table } from '@tanstack/react-table'

import { memo, useCallback } from 'react'
import { Footnote, type FootnoteProps } from '@/components/data-table/footnote'
import { DataTablePagination } from '@/components/data-table/pagination'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/format-number'

/**
 * Props for the DataTableFooter component
 *
 * @template TData - The row data type (extends RowData from TanStack Table)
 *
 * @param table - TanStack Table instance
 * @param footnote - Custom footnote content (string or React node)
 * @param compact - Compact mode with minimal pagination
 */
export interface DataTableFooterProps<TData extends RowData> {
  /** TanStack Table instance */
  table: Table<TData>
  /** Custom footnote content */
  footnote?: FootnoteProps['footnote']
  /** Compact mode: minimal row count + prev/next only */
  compact?: boolean
}

/**
 * DataTableFooter - Footer with pagination and footnote
 *
 * Handles:
 * - Pagination controls (previous, next, page size selector)
 * - Footnote display (row count, selection status, or custom content)
 * - Responsive layout with footnote on left, pagination on right
 *
 * Features:
 * - Hides pagination when all rows fit on one page
 * - Shows row selection count in default footnote
 * - Supports custom footnote content via props
 * - Compact mode shows minimal row count and prev/next buttons
 *
 * Performance: Memoized to prevent unnecessary re-renders
 */
export const DataTableFooter = memo(function DataTableFooter<
  TData extends RowData,
>({ table, footnote, compact = false }: DataTableFooterProps<TData>) {
  const handlePrev = useCallback(() => table.previousPage(), [table])
  const handleNext = useCallback(() => table.nextPage(), [table])

  if (compact) {
    const totalRows = table.getPrePaginationRowModel().rows.length
    const canPrev = table.getCanPreviousPage()
    const canNext = table.getCanNextPage()
    const hasMultiplePages = canPrev || canNext

    return (
      <div className="flex shrink-0 items-center justify-between px-1 py-1 text-xs text-muted-foreground">
        <span>{formatNumber(totalRows)} rows</span>
        {hasMultiplePages && (
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handlePrev}
              disabled={!canPrev}
            >
              <ChevronLeftIcon className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleNext}
              disabled={!canNext}
            >
              <ChevronRightIcon className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex shrink-0 items-center justify-between px-2">
      <Footnote table={table} footnote={footnote} />
      <DataTablePagination table={table} />
    </div>
  )
}) as <TData extends RowData>(
  props: DataTableFooterProps<TData>
) => React.JSX.Element
