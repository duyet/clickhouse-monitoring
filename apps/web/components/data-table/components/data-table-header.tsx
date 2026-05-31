'use client'

import {
  FilterIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
  Settings2Icon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import type { RowData, Table } from '@tanstack/react-table'

import type { TableDensity } from '@/components/data-table/hooks'
import type { ApiResponseMetadata } from '@/lib/api/types'
import type { ChartQueryParams } from '@/types/chart-data'
import type { QueryConfig } from '@/types/query-config'
import type { TableFilterCondition } from '../hooks/use-filtered-data'

import { memo, useState } from 'react'
import { CardToolbar } from '@/components/cards/card-toolbar'
import { CsvExportButton } from '@/components/data-table/buttons/csv-export-button'
import { ResetColumnOrderButton } from '@/components/data-table/buttons/reset-column-order'
import { BulkActions } from '@/components/data-table/components/bulk-actions'
import { Button } from '@/components/ui/button'
import { DebouncedInput } from '@/components/ui/debounced-input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getSqlForDisplay } from '@/types/query-config'

export interface DataTableHeaderProps<TData extends RowData> {
  /** Table title displayed in header */
  title: string
  /** Table description or subtitle */
  description: string | React.ReactNode
  /** Query configuration defining columns, formats, sorting */
  queryConfig: QueryConfig
  /** Additional toolbar elements (left side) */
  toolbarExtras?: React.ReactNode
  /** Additional toolbar elements (right side) */
  topRightToolbarExtras?: React.ReactNode
  /** Show SQL button visibility */
  showSQL: boolean
  /** TanStack Table instance */
  table: Table<TData>
  /** Parameters for query execution (search, sort, pagination) */
  queryParams?: ChartQueryParams
  /** Show loading indicator when refreshing data */
  isRefreshing: boolean
  /** The actual SQL that was executed (after version selection) */
  executedSql?: string
  /** Query execution metadata */
  metadata?: Partial<ApiResponseMetadata>
  /** Enable column reordering with drag-and-drop */
  enableColumnReordering?: boolean
  /** Callback to reset column order to default */
  onResetColumnOrder?: () => void
  /** Current row density mode */
  density?: TableDensity
  /** Callback to change row density mode */
  onDensityChange?: (density: TableDensity) => void

  // New premium table states
  globalSearch: string
  onGlobalSearchChange: (value: string) => void
  advancedFilters: TableFilterCondition[]
  onAdvancedFiltersChange: (filters: TableFilterCondition[]) => void

  enableColumnFilters?: boolean
  activeFilterCount?: number
  clearAllColumnFilters?: () => void
}

const OPERATOR_LABELS: Record<TableFilterCondition['operator'], string> = {
  contains: 'contains',
  equals: 'equals',
  startsWith: 'starts with',
  endsWith: 'ends with',
  notContains: 'does not contain',
}

export const DataTableHeader = memo(function DataTableHeader<
  TData extends RowData,
>({
  title,
  description,
  queryConfig,
  toolbarExtras,
  topRightToolbarExtras,
  showSQL,
  table,
  isRefreshing,
  executedSql,
  metadata,
  enableColumnReordering = false,
  onResetColumnOrder,
  density = 'comfortable',
  onDensityChange,
  globalSearch,
  onGlobalSearchChange,
  advancedFilters,
  onAdvancedFiltersChange,
}: DataTableHeaderProps<TData>) {
  const displaySql = executedSql || getSqlForDisplay(queryConfig.sql)

  // Popover filter draft state
  const [filterDrafts, setFilterDrafts] = useState<TableFilterCondition[]>([])
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  // Get eligible columns for advanced filtering
  const filterableColumns = table.getAllLeafColumns().filter((col) => {
    const id = col.id
    return id !== '__expand' && id !== 'select' && id !== 'actions'
  })

  // Open popover: sync draft state with committed state
  const handleOpenFilters = (open: boolean) => {
    setIsFiltersOpen(open)
    if (open) {
      setFilterDrafts(
        advancedFilters.length > 0
          ? [...advancedFilters]
          : [
              {
                id: Math.random().toString(36).substring(7),
                columnId: filterableColumns[0]?.id || '',
                operator: 'contains',
                value: '',
              },
            ]
      )
    }
  }

  const addFilterDraft = () => {
    setFilterDrafts((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        columnId: filterableColumns[0]?.id || '',
        operator: 'contains',
        value: '',
      },
    ])
  }

  const updateFilterDraft = (
    id: string,
    updates: Partial<Omit<TableFilterCondition, 'id'>>
  ) => {
    setFilterDrafts((prev) =>
      prev.map((draft) => (draft.id === id ? { ...draft, ...updates } : draft))
    )
  }

  const removeFilterDraft = (id: string) => {
    setFilterDrafts((prev) => {
      const filtered = prev.filter((draft) => draft.id !== id)
      return filtered.length > 0
        ? filtered
        : [
            {
              id: Math.random().toString(36).substring(7),
              columnId: filterableColumns[0]?.id || '',
              operator: 'contains',
              value: '',
            },
          ]
    })
  }

  const applyFilters = () => {
    // Only apply valid filters with values
    const validFilters = filterDrafts.filter(
      (draft) => draft.value.trim() !== ''
    )
    onAdvancedFiltersChange(validFilters)
    setIsFiltersOpen(false)
  }

  const removeCommittedFilter = (id: string) => {
    onAdvancedFiltersChange(advancedFilters.filter((f) => f.id !== id))
  }

  const clearAllFilters = () => {
    onGlobalSearchChange('')
    onAdvancedFiltersChange([])
  }

  return (
    <div className="flex flex-col gap-2.5 pb-2.5">
      {/* Row 1: Title and Description */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground flex-none">
              {title}
            </h1>
            {isRefreshing && (
              <Loader2Icon
                className="text-muted-foreground size-4 animate-spin shrink-0"
                aria-label="Loading data"
              />
            )}
            {toolbarExtras && (
              <div className="flex items-center gap-1">{toolbarExtras}</div>
            )}
            {queryConfig.bulkActions && queryConfig.bulkActions.length > 0 && (
              <BulkActions
                table={table}
                bulkActions={queryConfig.bulkActions}
                bulkActionKey={queryConfig.bulkActionKey || 'query_id'}
              />
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
            {description || queryConfig.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {topRightToolbarExtras}
          {showSQL && (
            <CardToolbar sql={displaySql} metadata={metadata} alwaysVisible />
          )}
        </div>
      </div>

      {/* Row 2: Cloudflare-style premium toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-card/65 dark:bg-card/40 border border-border/60 p-2 rounded-xl shadow-xs">
        {/* Search TextBox on left */}
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60"
            aria-hidden="true"
          />
          <DebouncedInput
            value={globalSearch}
            onValueChange={onGlobalSearchChange}
            placeholder={`Search across all fields...`}
            debounceMs={300}
            className="h-9 w-full pl-9 pr-8 text-sm bg-muted/20 border-border/50 focus:bg-background focus:border-primary/50 placeholder:text-muted-foreground/50 transition-all rounded-lg shadow-none"
          />
          {globalSearch && (
            <button
              type="button"
              onClick={() => onGlobalSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground p-0.5 rounded"
              aria-label="Clear search"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>

        {/* Buttons on Right */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filters Button with Advanced Popover */}
          <Popover open={isFiltersOpen} onOpenChange={handleOpenFilters}>
            <PopoverTrigger asChild>
              <Button
                variant={advancedFilters.length > 0 ? 'secondary' : 'outline'}
                size="sm"
                className="h-9 gap-1.5 px-3 border-border/50 rounded-lg text-xs"
              >
                <FilterIcon className="size-3.5" />
                <span>Filters</span>
                {advancedFilters.length > 0 && (
                  <span className="flex items-center justify-center size-4 bg-primary text-[10px] font-bold text-primary-foreground rounded-full">
                    {advancedFilters.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-[450px] p-4 rounded-xl shadow-lg border border-border/80"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <span className="text-sm font-semibold text-foreground">
                  Filters
                </span>
                <button
                  type="button"
                  onClick={() => setIsFiltersOpen(false)}
                  className="text-muted-foreground hover:text-foreground rounded p-1"
                >
                  <XIcon className="size-4" />
                </button>
              </div>

              {/* List of active filters rules */}
              <div className="flex flex-col gap-3 py-4 max-h-[300px] overflow-y-auto">
                {filterDrafts.map((draft) => (
                  <div key={draft.id} className="flex items-center gap-2">
                    {/* Column Select */}
                    <Select
                      value={draft.columnId}
                      onValueChange={(val) =>
                        updateFilterDraft(draft.id, { columnId: val })
                      }
                    >
                      <SelectTrigger className="h-8 flex-1 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {filterableColumns.map((col) => (
                          <SelectItem
                            key={col.id}
                            value={col.id}
                            className="text-xs"
                          >
                            {col.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Operator Select */}
                    <Select
                      value={draft.operator}
                      onValueChange={(val) =>
                        updateFilterDraft(draft.id, {
                          operator: val as TableFilterCondition['operator'],
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-[130px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(OPERATOR_LABELS).map(([op, label]) => (
                          <SelectItem key={op} value={op} className="text-xs">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Value Input */}
                    <Input
                      placeholder="value"
                      value={draft.value}
                      onChange={(e) =>
                        updateFilterDraft(draft.id, { value: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          applyFilters()
                        }
                      }}
                      className="h-8 flex-1 text-xs shadow-none"
                    />

                    {/* Trash Delete button */}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeFilterDraft(draft.id)}
                      className="size-8 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add and Apply footer */}
              <div className="flex items-center justify-between pt-2.5 border-t border-border/40 text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addFilterDraft}
                  className="h-8 gap-1 text-xs hover:bg-muted/50 rounded-lg text-primary font-medium"
                >
                  <PlusIcon className="size-3.5" /> Add condition
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    Press Enter to apply
                  </span>
                  <Button
                    size="sm"
                    onClick={applyFilters}
                    className="h-8 text-xs font-semibold rounded-lg"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Combined Display Options Dropdown */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 px-3 border-border/50 rounded-lg text-xs"
                aria-label="Column Options"
                title="Column Options"
              >
                <Settings2Icon className="size-3.5" />
                <span>Display options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 max-h-[80vh] overflow-y-auto rounded-xl shadow-lg"
            >
              <DropdownMenuLabel className="text-xs font-semibold px-2.5 py-1.5 text-muted-foreground uppercase tracking-wider">
                Density
              </DropdownMenuLabel>
              {onDensityChange && (
                <DropdownMenuRadioGroup
                  value={density}
                  onValueChange={(v) => onDensityChange(v as TableDensity)}
                  className="px-1"
                >
                  <DropdownMenuRadioItem
                    value="comfortable"
                    className="text-xs"
                  >
                    Comfortable
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="compact" className="text-xs">
                    Compact
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dense" className="text-xs">
                    Dense
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-xs font-semibold px-2.5 py-1.5 text-muted-foreground uppercase tracking-wider">
                Columns
              </DropdownMenuLabel>
              <div className="px-1">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                      onSelect={(e) => e.preventDefault()}
                      className="text-xs"
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export CSV button */}
          <CsvExportButton table={table} filename={queryConfig.name} />

          {/* Column Reordering Reset */}
          {enableColumnReordering && onResetColumnOrder && (
            <ResetColumnOrderButton onReset={onResetColumnOrder} />
          )}
        </div>
      </div>

      {/* Row 3: Records Count & Active Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs px-1 min-h-[24px]">
        {/* Count */}
        <span className="text-[12.5px] font-semibold text-muted-foreground/80">
          {table.getFilteredRowModel().rows.length} records
        </span>

        {/* Filter chips on the right */}
        {(advancedFilters.length > 0 || globalSearch) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {globalSearch && (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-medium transition-colors">
                <span>Search: &ldquo;{globalSearch}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => onGlobalSearchChange('')}
                  className="hover:text-foreground p-0.5 rounded"
                >
                  <XIcon className="size-3" />
                </button>
              </div>
            )}

            {advancedFilters.map((filter) => (
              <div
                key={filter.id}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted/60 dark:bg-muted/40 border border-border/50 text-foreground/80 text-[11px] font-medium transition-colors"
              >
                <span>
                  {filter.columnId} {OPERATOR_LABELS[filter.operator]} &ldquo;
                  {filter.value}
                  &rdquo;
                </span>
                <button
                  type="button"
                  onClick={() => removeCommittedFilter(filter.id)}
                  aria-label="Remove filter"
                  className="text-muted-foreground/60 hover:text-foreground p-0.5 rounded"
                >
                  <XIcon className="size-3" />
                </button>
              </div>
            ))}

            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-6 gap-1 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}) as <TData extends RowData>(
  props: DataTableHeaderProps<TData>
) => React.JSX.Element
