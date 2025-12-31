'use client'

import { cn } from '@/lib/utils'
import type { QueryConfig } from '@/types/query-config'
import { DataTableFacetedFilter } from './data-table-faceted-filter'

interface DataTableToolbarProps {
  queryConfig: QueryConfig
  children?: React.ReactNode
  className?: string
}

export function DataTableToolbar({
  queryConfig,
  children,
  className,
}: DataTableToolbarProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {children}
        {queryConfig.filterParamPresets && (
          <DataTableFacetedFilter title="Filters" queryConfig={queryConfig} />
        )}
      </div>
    </div>
  )
}
