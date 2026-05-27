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
import { cn } from '@/lib/utils'

export interface ColumnHeaderProps<TData extends RowData> {
  column: Column<TData, unknown>
  name: string
  format: ColumnFormat
  icon?: Icon
  isFilterable: boolean
  filterValue: string
  onFilterChange: (value: string) => void
}

function SortIcon({ sortState }: { sortState: false | 'asc' | 'desc' }) {
  if (sortState === false)
    return <CaretSortIcon className="ml-1 size-3.5 opacity-40" />
  if (sortState === 'asc')
    return <CaretUpIcon className="ml-1 size-3.5 text-primary" />
  return <CaretDownIcon className="ml-1 size-3.5 text-primary" />
}

function HeaderContent({
  name,
  format,
  icon: Icon,
}: {
  name: string
  format: ColumnFormat
  icon?: Icon
}) {
  if (format === 'action') {
    return <span className="text-muted-foreground/60">actions</span>
  }

  return (
    <span className="inline-flex flex-1 min-w-0 items-center gap-1 truncate text-muted-foreground">
      {Icon && <Icon className="size-3 shrink-0" />}
      <span className="truncate">{name}</span>
    </span>
  )
}

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
  const canSort = column.getCanSort()

  return (
    <div className="flex flex-col gap-1">
      <div
        role={canSort ? 'button' : undefined}
        tabIndex={canSort ? 0 : undefined}
        onClick={() => {
          if (canSort) column.toggleSorting(sortState === 'asc')
        }}
        onKeyDown={(e) => {
          if (canSort && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            column.toggleSorting(sortState === 'asc')
          }
        }}
        className={cn(
          'flex w-full items-center gap-0.5 truncate text-xs font-medium uppercase tracking-wider select-none',
          canSort && 'cursor-pointer hover:text-foreground'
        )}
      >
        <HeaderContent name={name} format={format} icon={icon} />
        {canSort && <SortIcon sortState={sortState} />}
        {filterValue && (
          <span
            className="ml-1 size-1.5 rounded-full bg-primary shrink-0"
            aria-label="Filter active"
          />
        )}
      </div>

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
