'use client'

import { flexRender } from '@tanstack/react-table'

import { memo } from 'react'
import { TableHead, TableRow } from '@/components/ui/table'

/**
 * Props for TableHeaderRow component
 */
export interface TableHeaderRowProps {
  headers: any
}

/**
 * TableHeaderRow - Renders a single header row with sortable columns
 *
 * Handles:
 * - Column header rendering with flexRender for custom content
 * - Placeholder cells for expandable rows
 * - Consistent styling with hover effects
 *
 * Performance: Memoized to prevent unnecessary re-renders
 */
export const TableHeaderRow = memo(function TableHeaderRow({
  headers,
}: TableHeaderRowProps) {
  return (
    <TableRow className="border-b border-border hover:bg-transparent">
      {headers.map((header: any) => {
        return (
          <TableHead
            key={header.id}
            scope="col"
            className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            {header.isPlaceholder
              ? null
              : flexRender(header.column.columnDef.header, header.getContext())}
          </TableHead>
        )
      })}
    </TableRow>
  )
})

/**
 * Props for TableHeader component
 */
export interface TableHeaderProps {
  headerGroups: any
}

/**
 * TableHeader - Renders the complete table header section
 *
 * @param headerGroups - Array of header groups from TanStack Table
 *
 * Renders all header groups (typically one) with TableHeaderRow components.
 * Performance: Memoized to prevent unnecessary re-renders
 */
export const TableHeader = memo(function TableHeader({
  headerGroups,
}: TableHeaderProps) {
  return (
    <>
      {headerGroups.map((headerGroup: any) => (
        <TableHeaderRow key={headerGroup.id} headers={headerGroup.headers} />
      ))}
    </>
  )
})
