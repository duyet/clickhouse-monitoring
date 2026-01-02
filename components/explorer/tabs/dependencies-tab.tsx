'use client'

import { ArrowDownToLine, ArrowUpFromLine, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'

import { useExplorerState } from '../hooks/use-explorer-state'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useHostId } from '@/lib/swr/use-host'

interface UpstreamDependency {
  source_database: string
  source_table: string
  engine: string
  type: string
}

interface DownstreamDependency {
  dependent_database: string
  dependent_table: string
  engine: string
  type: string
  create_table_query: string
}

interface ApiResponse<T> {
  data: T
  metadata?: Record<string, unknown>
}

const fetcher = <T,>(url: string): Promise<ApiResponse<T>> =>
  fetch(url).then((res) => res.json())

function getTypeBadgeVariant(type: string): 'default' | 'secondary' | 'outline' {
  switch (type) {
    case 'Materialized View':
      return 'default'
    case 'View':
      return 'secondary'
    default:
      return 'outline'
  }
}

export function DependenciesTab() {
  const hostId = useHostId()
  const { database, table } = useExplorerState()

  // Fetch upstream dependencies
  const {
    data: upstreamResponse,
    error: upstreamError,
    isLoading: upstreamLoading,
  } = useSWR<ApiResponse<UpstreamDependency[]>>(
    database && table
      ? `/api/v1/explorer/dependencies?hostId=${hostId}&database=${encodeURIComponent(database)}&table=${encodeURIComponent(table)}&direction=upstream`
      : null,
    fetcher<UpstreamDependency[]>
  )

  // Fetch downstream dependencies
  const {
    data: downstreamResponse,
    error: downstreamError,
    isLoading: downstreamLoading,
  } = useSWR<ApiResponse<DownstreamDependency[]>>(
    database && table
      ? `/api/v1/explorer/dependencies?hostId=${hostId}&database=${encodeURIComponent(database)}&table=${encodeURIComponent(table)}&direction=downstream`
      : null,
    fetcher<DownstreamDependency[]>
  )

  const upstreamDeps = upstreamResponse?.data || []
  const downstreamDeps = downstreamResponse?.data || []

  if (!database || !table) {
    return null
  }

  const isLoading = upstreamLoading || downstreamLoading
  const error = upstreamError || downstreamError

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-destructive">
            Failed to load dependencies: {error.message}
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasDependencies = upstreamDeps.length > 0 || downstreamDeps.length > 0

  return (
    <div className="flex flex-col gap-6">
      {/* Upstream Dependencies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowUpFromLine className="size-4" />
            Upstream Dependencies
            <Badge variant="outline" className="ml-2">
              {upstreamDeps.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upstreamDeps.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Database</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Engine</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upstreamDeps.map((dep) => (
                  <TableRow key={`${dep.source_database}.${dep.source_table}`}>
                    <TableCell>{dep.source_database}</TableCell>
                    <TableCell className="font-medium">
                      {dep.source_table}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(dep.type)}>
                        {dep.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {dep.engine}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/explorer?host=${hostId}&database=${encodeURIComponent(dep.source_database)}&table=${encodeURIComponent(dep.source_table)}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="size-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              This table has no upstream dependencies
            </p>
          )}
        </CardContent>
      </Card>

      {/* Downstream Dependencies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowDownToLine className="size-4" />
            Downstream Dependencies
            <Badge variant="outline" className="ml-2">
              {downstreamDeps.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {downstreamDeps.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Database</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Engine</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {downstreamDeps.map((dep) => (
                  <TableRow
                    key={`${dep.dependent_database}.${dep.dependent_table}`}
                  >
                    <TableCell>{dep.dependent_database}</TableCell>
                    <TableCell className="font-medium">
                      {dep.dependent_table}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(dep.type)}>
                        {dep.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {dep.engine}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/explorer?host=${hostId}&database=${encodeURIComponent(dep.dependent_database)}&table=${encodeURIComponent(dep.dependent_table)}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="size-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No tables or views depend on this table
            </p>
          )}
        </CardContent>
      </Card>

      {/* Help text */}
      {!hasDependencies && (
        <p className="text-center text-sm text-muted-foreground">
          Dependencies are tracked for Materialized Views and Views. Regular
          tables typically don't have tracked dependencies.
        </p>
      )}
    </div>
  )
}
