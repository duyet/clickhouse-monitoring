'use client'

import type { RowData } from '@tanstack/react-table'
import type { Table } from '@tanstack/react-table'
import { memo } from 'react'

import { DataTablePagination } from '@/components/data-table/pagination'
import { Footnote, type FootnoteProps } from '@/components/data-table/footnote'

/**
 * Props for the DataTableFooter component
 *
 * @template TData - The row data type (extends RowData from TanStack Table)
 *
 * @param table - TanStack Table instance
 * @param footnote - Custom footnote content (string or React node)
 */
export interface DataTableFooterProps<TData extends RowData> {
  /** TanStack Table instance */
  table: Table<TData>
  /** Custom footnote content */
  footnote?: FootnoteProps['footnote']
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
 *
 * Performance: Memoized to prevent unnecessary re-renders
 */
export const DataTableFooter = memo(function DataTableFooter<
  TData extends RowData
>({ table, footnote }: DataTableFooterProps<TData>) {
  return (
    <div className="flex shrink-0 items-center justify-between px-2">
      <Footnote table={table} footnote={footnote} />
      <DataTablePagination table={table} />
    </div>
  )
}) as <TData extends RowData>(props: DataTableFooterProps<TData>) => JSX.Element
