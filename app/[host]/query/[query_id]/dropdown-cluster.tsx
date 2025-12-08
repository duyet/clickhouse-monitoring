import { ErrorAlert } from '@/components/error-alert'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { fetchData } from '@/lib/clickhouse'

import {
  formatErrorMessage,
  formatErrorTitle,
  getErrorDocumentation,
} from '@/lib/error-utils'
import { getHostIdCookie } from '@/lib/scoped-link'
import { CircleCheckIcon, CombineIcon } from 'lucide-react'
import type { PageProps } from './types'

interface RowData {
  cluster: string
  replica_count: number
}

const sql = `
  SELECT DISTINCT
      cluster,
      count(replica_num) AS replica_count
  FROM system.clusters
  GROUP BY 1
`

export async function DropdownCluster({
  params,
  searchParams,
  className,
}: {
  params: Awaited<PageProps['params']>
  searchParams: Awaited<PageProps['searchParams']>
  className?: string
}) {
  const { query_id } = params
  const { cluster } = searchParams
  const hostId = await getHostIdCookie()
  const path = `/${hostId}/query/${query_id}/`

  const { data, error } = await fetchData<RowData[]>({
    query: sql,
    format: 'JSONEachRow',
    clickhouse_settings: {
      use_query_cache: 0,
    },
    hostId,
  })

  if (error) {
    return (
      <ErrorAlert
        title={formatErrorTitle(error)}
        message={formatErrorMessage(error)}
        docs={getErrorDocumentation(error)}
        query={sql}
      />
    )
  }

  if (!data?.length) {
    return null
  }

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            {cluster ? (
              <span className="flex items-center gap-1">
                <CircleCheckIcon className="size-3" />
                {cluster}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <CombineIcon className="size-3" />
                Query Across Cluster
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Query Across Cluster</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={cluster}>
            {data.map((row) => (
              <DropdownMenuRadioItem key={row.cluster} value={row.cluster}>
                <a
                  href={
                    cluster === row.cluster
                      ? path
                      : `${path}?cluster=${row.cluster}`
                  }
                >
                  {row.cluster} ({row.replica_count} replicas)
                </a>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
