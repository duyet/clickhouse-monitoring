/**
 * Draggable table content component (lazy-loaded)
 *
 * This component is only loaded when enableColumnReordering is true.
 * It includes the @dnd-kit dependencies (~62KB) which are code-split.
 */

'use client'

import type { ColumnDef, RowData } from '@tanstack/react-table'

import type { QueryConfig } from '@/types/query-config'

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import {
  horizontalListSortingStrategy,
  SortableContext,
} from '@dnd-kit/sortable'
import { memo, useCallback } from 'react'
import {
  TableBody as TableBodyRenderer,
  TableHeader as TableHeaderRenderer,
} from '@/components/data-table/renderers'
import { Table, TableBody, TableHeader } from '@/components/ui/table'

/**
 * Props for the DraggableTableContent component
 */
export interface DraggableTableContentProps<
  TData extends RowData,
  TValue extends React.ReactNode,
> {
  title: string
  description: string | React.ReactNode
  queryConfig: QueryConfig
  table: import('@tanstack/react-table').Table<TData>
  columnDefs: ColumnDef<TData, TValue>[]
  tableContainerRef: React.RefObject<HTMLDivElement>
  isVirtualized: boolean
  virtualizer: ReturnType<
    typeof import('@/components/data-table/hooks').useVirtualRows
  >['virtualizer']
  activeFilterCount: number
  onAutoFit?: (columnId: string) => void
  onColumnOrderChange?: (activeId: string, overId: string) => void
}

/**
 * DraggableTableContent - Table content with drag-and-drop column reordering
 *
 * This component is lazy-loaded via dynamic import to reduce initial bundle size.
 * The dnd-kit packages add ~62KB but are only needed for column reordering.
 */
export const DraggableTableContent = memo(function DraggableTableContent<
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
  onColumnOrderChange,
}: DraggableTableContentProps<TData, TValue>) {
  // Configure drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag (prevents accidental drags)
      },
    })
  )

  // Handle drag end event for column reordering
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (over && active.id !== over.id) {
        onColumnOrderChange?.(String(active.id), String(over.id))
      }
    },
    [onColumnOrderChange]
  )

  // Extract column IDs for SortableContext
  // IMPORTANT: Must match all columns, not just sortable ones, for proper reordering
  const columnIds = table.getAllLeafColumns().map((col) => col.id)

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
          enableColumnReordering={true}
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToHorizontalAxis]}
      >
        <SortableContext
          items={columnIds}
          strategy={horizontalListSortingStrategy}
        >
          {tableContent}
        </SortableContext>
      </DndContext>
    </div>
  )
}) as <TData extends RowData, TValue extends React.ReactNode>(
  props: DraggableTableContentProps<TData, TValue>
) => JSX.Element
