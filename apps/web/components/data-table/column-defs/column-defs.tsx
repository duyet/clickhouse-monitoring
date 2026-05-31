/**
 * Column definition generator for TanStack Table
 *
 * Generates an array of column definitions based on query configuration.
 * Handles formatting, sorting, filtering, and cell rendering.
 */

import type {
  Column,
  ColumnDef,
  Row,
  RowData,
  Table,
} from '@tanstack/react-table'

import type { ColumnFormat, ColumnFormatOptions } from '@/types/column-format'
import type {
  ColumnFilterContext,
  GetColumnDefsOptions,
  SchemaColumnFilterContext,
} from './types'

import { resolveColumnFilterField } from '../filters/column-filter-bridge'
import { ExpandChevron } from '../row-expand/expand-chevron'
import { getCustomSortingFns } from '../sorting-fns'
import { ColumnCell } from './components/column-cell'
import { ColumnHeader } from './components/column-header'
import { assignSortingFn } from './sorting'
import {
  isColumnFilterable,
  normalizeColumnName,
  parseColumnFormat,
} from './utils'

export const EXPAND_COLUMN_ID = '__expand'

/** Build the synthetic leftmost column that renders an expand/collapse chevron. */
export function buildExpandColumnDef<
  TData extends RowData,
  TValue extends React.ReactNode,
>(): ColumnDef<TData, TValue> {
  return {
    id: EXPAND_COLUMN_ID,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 32,
    minSize: 32,
    maxSize: 32,
    header: () => <span className="sr-only">Expand row</span>,
    cell: ({ row }: { row: Row<TData> }) => <ExpandChevron row={row} />,
  } as ColumnDef<TData, TValue>
}

export type {
  ColumnFilterContext,
  ColumnFormatInfo,
  ColumnType,
  GetColumnDefsOptions,
} from './types'

export { normalizeColumnName } from './utils'

/**
 * Generates an array of column definitions based on the provided configuration.
 *
 * @param config - The configuration object for the query.
 * @param data - The data array for cell rendering context.
 * @param context - Additional context for cell formatting.
 * @param filterContext - Optional filter context for column filtering.
 *
 * @returns An array of column definitions.
 *
 * @example
 * ```tsx
 * const columns = getColumnDefs(config, data, {}, {
 *   enableColumnFilters: true,
 *   filterableColumns: ['name', 'status'],
 *   columnFilters: { name: 'foo' },
 *   setColumnFilter: (col, val) => {...},
 *   clearColumnFilter: (col) => {...},
 * })
 * ```
 */
export function getColumnDefs<
  TData extends RowData,
  TValue extends React.ReactNode,
>(
  config: GetColumnDefsOptions<TData>['config'],
  data: TData[],
  context: GetColumnDefsOptions<TData>['context'],
  filterContext?: ColumnFilterContext,
  schemaFilterContext?: SchemaColumnFilterContext
): ColumnDef<TData, TValue>[] {
  const configColumns = config.columns || []
  const customSortingFns = getCustomSortingFns<TData>()

  const {
    enableColumnFilters = false,
    filterableColumns = [],
    columnFilters = {},
    setColumnFilter,
  } = filterContext || {}

  return configColumns.map((column) => {
    const name = normalizeColumnName(column)
    const { format: columnFormat, options: columnFormatOptions } =
      parseColumnFormat(column, config.columnFormats || {})
    const sortingFnName = config.sortingFns?.[name]
    const sizing = config.columnSizing?.[name] ?? config.columnSizing?.[column]

    // Check if this column should have a filter
    const isFilterable = isColumnFilterable(
      name,
      enableColumnFilters,
      filterableColumns
    )

    // Schema-driven typed filter (date-range, multi-select, etc.)
    const columnFilterDef = config.columnFilters?.[
      column as keyof typeof config.columnFilters
    ] as
      | NonNullable<typeof config.columnFilters>[keyof NonNullable<
          typeof config.columnFilters
        >]
      | undefined
    const schemaField = schemaFilterContext
      ? resolveColumnFilterField(
          name,
          columnFilterDef,
          schemaFilterContext.schema
        )
      : null
    const schemaFilter =
      schemaField && columnFilterDef && schemaFilterContext
        ? {
            field: schemaField,
            def: columnFilterDef,
            configName: schemaFilterContext.configName,
            activeFilter: schemaFilterContext.getActiveFilter(schemaField),
            onSubmit: (
              draft: import('@/components/filters/filter-editor').FilterDraft
            ) => schemaFilterContext.setFilter(schemaField.key, draft),
            onClear: () => schemaFilterContext.clearFilter(schemaField.key),
          }
        : undefined

    // Create the column definition
    const columnDef: ColumnDef<TData, TValue> = {
      id: name,
      accessorKey: column,

      header: ({ column: col }) => (
        <ColumnHeader<TData>
          column={col as Column<TData, unknown>}
          name={name}
          format={columnFormat as ColumnFormat}
          icon={config.columnIcons?.[name]}
          description={
            config.columnDescriptions?.[name] ??
            config.columnDescriptions?.[column]
          }
          isFilterable={isFilterable}
          filterValue={columnFilters[name] || ''}
          onFilterChange={(value) => setColumnFilter?.(name, value)}
          schemaFilter={schemaFilter}
        />
      ),

      cell: ({
        table,
        row,
        getValue,
      }: {
        table: Table<TData>
        row: Row<TData>
        getValue: () => TValue
      }) => (
        <ColumnCell<TData, TValue>
          table={table}
          data={data}
          row={row}
          getValue={getValue}
          columnKey={column}
          context={context}
          format={columnFormat as ColumnFormat}
          formatOptions={columnFormatOptions as ColumnFormatOptions}
        />
      ),
    }

    // Single-trigger action columns (ColumnFormat.Action → "⋯" dropdown menu)
    // render one icon button, so cap them tight. We deliberately do NOT match
    // by column name nor by ColumnFormat.InlineAction — inline-action columns
    // render multiple buttons (kill / analyze / open-in-explorer on Running
    // Queries) and need their natural width plus resize.
    const isMenuActionColumn = columnFormat === 'action'
    if (isMenuActionColumn) {
      columnDef.size = 56
      columnDef.minSize = 48
      columnDef.maxSize = 80
      columnDef.enableResizing = false
      columnDef.enableSorting = false
      columnDef.enableHiding = false
    }

    if (sizing?.size !== undefined) {
      columnDef.size = sizing.size
    }
    if (sizing?.minSize !== undefined) {
      columnDef.minSize = sizing.minSize
    }
    if (sizing?.maxSize !== undefined) {
      columnDef.maxSize = sizing.maxSize
    }

    // Add the sorting function if specified
    assignSortingFn(columnDef, sortingFnName, customSortingFns)

    return columnDef
  })
}
