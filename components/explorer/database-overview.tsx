'use client'

import { DatabaseIcon } from 'lucide-react'
import useSWR from 'swr'

import type { ApiResponseMetadata } from '@/lib/api/types'

import {
  type DependencyEdge,
  DependencyGraph,
} from './dependency-graph/dependency-graph'
import { useMemo } from 'react'
import { CardToolbar } from '@/components/cards/card-toolbar'
import { Skeleton } from '@/components/ui/skeleton'

interface ApiResponse<T> {
  data: T
  metadata?: ApiResponseMetadata
}

const fetcher = <T,>(url: string): Promise<ApiResponse<T>> =>
  fetch(url).then((res) => res.json())

interface DatabaseOverviewProps {
  database: string
  hostId: number
}

export function DatabaseOverview({ database, hostId }: DatabaseOverviewProps) {
  // Use unified query that includes all dependency types + standalone tables
  const depsUrl = `/api/v1/explorer/dependencies?hostId=${hostId}&database=${encodeURIComponent(database)}&direction=all`

  // Fetch all dependencies using unified query
  const { data: depsData, isLoading } = useSWR<ApiResponse<DependencyEdge[]>>(
    depsUrl,
    fetcher<DependencyEdge[]>
  )

  const graphData = depsData?.data || []

  // Count actual dependencies (edges with targets)
  const { tableCount, depCount } = useMemo(() => {
    const tables = new Set<string>()
    let deps = 0
    for (const dep of graphData) {
      tables.add(dep.source_table)
      if (dep.target_table) {
        tables.add(dep.target_table)
        deps++
      }
    }
    return { tableCount: tables.size, depCount: deps }
  }, [graphData])

  const metadata = useMemo(() => {
    if (!depsData?.metadata) return undefined
    return {
      ...depsData.metadata,
      api: depsUrl,
    }
  }, [depsData?.metadata, depsUrl])

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="flex-1 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="group flex h-full flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
          <DatabaseIcon className="size-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{database}</h2>
          <p className="text-sm text-muted-foreground">
            {tableCount} table{tableCount !== 1 ? 's' : ''}
            {depCount > 0 &&
              ` · ${depCount} dependency relationship${depCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <CardToolbar
          sql={depsData?.metadata?.sql}
          metadata={metadata}
          data={graphData as unknown as Record<string, unknown>[]}
        />
      </div>

      {/* Dependency Graph - full area */}
      <DependencyGraph
        dependencies={graphData}
        currentDatabase={database}
        hostId={hostId}
        className="flex-1 min-h-[400px]"
      />
    </div>
  )
}
