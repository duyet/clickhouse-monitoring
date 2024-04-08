'use client'

import type { QueryConfig } from '@/lib/types/query-config'
import { cn } from '@/lib/utils'
import { DataTableFacetedFilter } from './data-table-faceted-filter'

interface DataTableToolbarProps {
  config: QueryConfig
  extras?: React.ReactNode
  className?: string
}

export function DataTableToolbar({
  config,
  extras,
  className,
}: DataTableToolbarProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex flex-1 items-center space-x-2">
        {extras}

        {config.filterParamPresets && (
          <DataTableFacetedFilter
            title="Filters"
            presets={config.filterParamPresets}
          />
        )}
      </div>
    </div>
  )
}
