/**
 * Column header component with sorting and filtering
 */

'use client'

import {
  CaretDownIcon,
  CaretSortIcon,
  CaretUpIcon,
} from '@radix-ui/react-icons'
import type { Column, RowData } from '@tanstack/react-table'

import type { ColumnFormat } from '@/types/column-format'
import type { Icon } from '@/types/icon'

import { ColumnFilter } from '@/components/data-table/column-filter'
import { Button } from '@/components/ui/button'

export interface ColumnHeaderProps<TData extends RowData> {
  column: Column<TData, unknown>
  name: string
  format: ColumnFormat
  icon?: Icon
  isFilterable: boolean
  filterValue: string
  onFilterChange: (value: string) => void
}

/**
 * Sort icon component showing current sort state
 */
function SortIcon({ sortState }: { sortState: false | 'asc' | 'desc' }) {
  if (sortState === false) return <CaretSortIcon className="ml-2 size-4" />
  if (sortState === 'asc') return <CaretUpIcon className="ml-2 size-4" />
  return <CaretDownIcon className="ml-2 size-4" />
}

/**
 * Header content with optional icon
 */
function HeaderContent({
  name,
  format,
  icon,
}: {
  name: string
  format: ColumnFormat
  icon?: Icon
}) {
  if (format === 'action') {
    return <div className="text-muted-foreground">action</div>
  }

  const CustomIcon = icon

  return (
    <div className="text-muted-foreground">
      {CustomIcon ? <CustomIcon /> : null}
      {name}
    </div>
  )
}

/**
 * Column header with sorting indicator and optional filter input
 */
export function ColumnHeader<TData extends RowData>({
  column,
  name,
  format,
  icon,
  isFilterable,
  filterValue,
  onFilterChange,
}: ColumnHeaderProps<TData>) {
  const sortState = column.getIsSorted()

  return (
    <div className="flex flex-col gap-1.5 py-1">
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(sortState === 'asc')}
        className="h-8 truncate justify-start font-medium"
      >
        <HeaderContent name={name} format={format} icon={icon} />
        <SortIcon sortState={sortState} />
      </Button>

      {isFilterable && (
        <ColumnFilter
          column={name}
          value={filterValue}
          onChange={onFilterChange}
          placeholder={`Filter ${name}...`}
          showClear
        />
      )}
    </div>
  )
}
