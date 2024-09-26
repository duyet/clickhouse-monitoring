'use client'

import { cn } from '@/lib/utils'
import type { QueryConfig } from '@/types/query-config'
import { DataTableFacetedFilter } from './data-table-faceted-filter'

interface DataTableToolbarProps {
  queryConfig: QueryConfig
  extras?: React.ReactNode
  className?: string
}

export function DataTableToolbar({
  queryConfig,
  extras,
  className,
}: DataTableToolbarProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex flex-1 items-center space-x-2">
        {extras}

        {queryConfig.filterParamPresets && (
          <DataTableFacetedFilter
            title="Filters"
            presets={queryConfig.filterParamPresets}
          />
        )}
      </div>
    </div>
  )
}
