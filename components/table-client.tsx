'use client'

import { DataTable } from '@/components/data-table/data-table'
import { ErrorAlert } from '@/components/error-alert'
import { TableSkeleton } from '@/components/skeleton'
import { useTableData } from '@/lib/swr/use-table-data'
import { useHostId } from '@/lib/swr/use-host'
import type { QueryConfig } from '@/types/query-config'

interface TableClientProps {
  title: string
  description?: string | React.ReactNode
  queryConfig: QueryConfig
  searchParams?: Record<string, string | number | boolean>
  className?: string
  defaultPageSize?: number
  topRightToolbarExtras?: React.ReactNode
}

/**
 * Client-side table wrapper that handles data fetching with SWR
 * Provides loading, error, and empty states with automatic refresh capability
 *
 * @example
 * ```tsx
 * export default function QueryLogsPage() {
 *   return (
 *     <TableClient
 *       title="Query Logs"
 *       description="All queries executed on the cluster"
 *       queryConfig={queryLogsConfig}
 *     />
 *   )
 * }
 * ```
 */
export function TableClient({
  title,
  description,
  queryConfig,
  searchParams = {},
  className,
  defaultPageSize = 100,
  topRightToolbarExtras,
}: TableClientProps) {
  const hostId = useHostId()

  const { data, metadata, error, isLoading, refresh } = useTableData<
    Record<string, unknown>
  >(queryConfig.name, hostId, searchParams, 30000)

  if (isLoading) {
    return <TableSkeleton />
  }

  if (error) {
    return (
      <ErrorAlert
        title="Error loading data"
        message={error.message}
        errorType="query_error"
        reset={refresh}
        query={queryConfig.sql}
      />
    )
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <ErrorAlert
        title="No Data"
        message="No data available for this query"
        variant="info"
        query={queryConfig.sql}
      />
    )
  }

  return (
    <DataTable
      title={title}
      description={description}
      queryConfig={queryConfig}
      queryParams={searchParams}
      data={data}
      context={{ ...searchParams, hostId: String(hostId) }}
      defaultPageSize={defaultPageSize}
      footnote={
        metadata
          ? `${metadata.rows} row(s) in ${metadata.duration?.toFixed(2)}s`
          : undefined
      }
      className={className}
      topRightToolbarExtras={topRightToolbarExtras}
    />
  )
}
