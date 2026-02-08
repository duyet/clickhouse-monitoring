'use client'

import type { ColumnDef, RowData } from '@tanstack/react-table'

import type { QueryConfig } from '@/types/query-config'

import { memo, useMemo } from 'react'
import {
  TableBody as TableBodyRenderer,
  TableHeader as TableHeaderRenderer,
} from '@/components/data-table/renderers'
import { Table, TableBody, TableHeader } from '@/components/ui/table'

/**
 * Props for the DataTableContent component
 *
 * @template TData - The row data type (extends RowData from TanStack Table)
 * @template TValue - The cell value type
 *
 * @param title - Table title for accessibility and empty state
 * @param description - Table description for accessibility
 * @param queryConfig - Query configuration defining columns, formats, sorting
 * @param table - TanStack Table instance
 * @param columnDefs - Column definitions for rendering
 * @param tableContainerRef - Ref for the table container (used for virtualization)
 * @param isVirtualized - Whether virtualization is enabled (1000+ rows)
 * @param virtualizer - Virtual row instance from useVirtualRows hook
 * @param activeFilterCount - Number of active column filters
 * @param onAutoFit - Callback when double-clicking column resizer to auto-fit
 */
export interface DataTableContentProps<
  TData extends RowData,
  TValue extends React.ReactNode,
> {
  /** Table title for accessibility and empty state */
  title: string
  /** Table description for accessibility */
  description: string | React.ReactNode
  /** Query configuration defining columns, formats, sorting */
  queryConfig: QueryConfig
  /** TanStack Table instance */
  table: import('@tanstack/react-table').Table<TData>
  /** Column definitions for rendering */
  columnDefs: ColumnDef<TData, TValue>[]
  /** Ref for the table container (used for virtualization) */
  tableContainerRef: React.RefObject<HTMLDivElement>
  /** Whether virtualization is enabled (1000+ rows) */
  isVirtualized: boolean
  /** Virtual row instance from useVirtualRows hook */
  virtualizer: ReturnType<
    typeof import('@/components/data-table/hooks').useVirtualRows
  >['virtualizer']
  /** Number of active column filters */
  activeFilterCount: number
  /** Callback when double-clicking column resizer to auto-fit */
  onAutoFit?: (columnId: string) => void
  /** Enable column reordering with drag-and-drop */
  enableColumnReordering?: boolean
  /** Callback when column order changes */
  onColumnOrderChange?: (activeId: string, overId: string) => void
  /** Callback to reset column order to default */
  onResetColumnOrder?: () => void
}

/**
 * DataTableContent - Content wrapper with virtualization logic
 *
 * Handles:
 * - Virtual scrolling for large datasets (1000+ rows)
 * - Standard scrolling for smaller datasets
 * - Table header and body rendering
 * - Empty state handling with contextual messaging
 * - Accessibility with proper ARIA labels
 * - Auto-fit column sizing callback propagation
 *
 * Performance considerations:
 * - Virtualization reduces DOM nodes from thousands to ~100
 * - Memoized to prevent unnecessary re-renders
 * - Auto-enables virtualization at 1000+ rows
 * - Drag-and-drop dependencies are lazy-loaded (~62KB saved when not needed)
 *
 * Code Splitting:
 * - When enableColumnReordering is false: No dnd-kit dependencies loaded
 * - When enableColumnReordering is true: Lazy-loads data-table-content-dnd.tsx
 */
export const DataTableContent = memo(function DataTableContent<
  TData extends RowData,
  TValue extends React.ReactNode,
>({
  title,
  description,
  queryConfig,
  table,
  columnDefs,
  tableContainerRef,
  isVirtualized,
  virtualizer,
  activeFilterCount,
  onAutoFit,
  enableColumnReordering = true,
  onColumnOrderChange,
  onResetColumnOrder: _onResetColumnOrder,
}: DataTableContentProps<TData, TValue>) {
  // Lazy load drag-and-drop version when reordering is enabled
  // This creates a separate chunk in the bundle
  // IMPORTANT: Must call hooks before any conditional returns
  const DraggableTableContentComponent = useMemo(
    () =>
      enableColumnReordering
        ? require('@/components/data-table/components/data-table-content-dnd')
            .DraggableTableContent
        : null,
    [enableColumnReordering]
  )

  // Common table content without drag-and-drop
  const tableContent = (
    <Table
      aria-describedby="table-description"
      // Force re-render when column order changes
      key={table.getState().columnOrder.join(',')}
    >
      <caption id="table-description" className="sr-only">
        {description || queryConfig.description || `${title} data table`}
      </caption>
      <TableHeader className="bg-muted/50">
        <TableHeaderRenderer
          headerGroups={table.getHeaderGroups()}
          onAutoFit={onAutoFit}
          enableColumnReordering={enableColumnReordering}
        />
      </TableHeader>
      <TableBody>
        <TableBodyRenderer
          table={table}
          columnDefs={columnDefs}
          isVirtualized={isVirtualized}
          virtualizer={virtualizer}
          title={title}
          activeFilterCount={activeFilterCount}
        />
      </TableBody>
    </Table>
  )

  // Standard version without drag-and-drop (most common case)
  if (!enableColumnReordering) {
    return (
      <div
        ref={tableContainerRef}
        className={`mb-5 min-h-0 min-w-0 rounded-lg border border-border/50 bg-card/30 ${
          isVirtualized ? 'flex-1 overflow-auto' : 'w-full overflow-x-auto'
        }`}
        role="region"
        aria-label={`${title || 'Data'} table`}
        style={isVirtualized ? { height: '60vh' } : undefined}
      >
        {tableContent}
      </div>
    )
  }

  if (enableColumnReordering && DraggableTableContentComponent) {
    return (
      <DraggableTableContentComponent
        title={title}
        description={description}
        queryConfig={queryConfig}
        table={table}
        columnDefs={columnDefs}
        tableContainerRef={tableContainerRef}
        isVirtualized={isVirtualized}
        virtualizer={virtualizer}
        activeFilterCount={activeFilterCount}
        onAutoFit={onAutoFit}
        onColumnOrderChange={onColumnOrderChange}
      />
    )
  }

  // Should never reach here, but TypeScript needs a return
  return null
}) as <TData extends RowData, TValue extends React.ReactNode>(
  props: DataTableContentProps<TData, TValue>
) => JSX.Element
