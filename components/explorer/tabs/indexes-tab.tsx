'use client'

import { Database, Filter, Key, Layers, Settings } from 'lucide-react'
import useSWR from 'swr'

import { useExplorerState } from '../hooks/use-explorer-state'
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

interface IndexesData {
  partition_key: string
  sorting_key: string
  primary_key: string
  sampling_key: string
  engine: string
  engine_full: string
}

interface SkipIndexData {
  name: string
  type: string
  type_full: string
  expr: string
  granularity: number
  compressed_size: string
  uncompressed_size: string
  compression_ratio: number
}

interface ProjectionData {
  name: string
  compressed_size: string
  uncompressed_size: string
  compression_ratio: number
  rows: string
  parts: number
}

interface ApiResponse<T> {
  data: T
  metadata?: Record<string, unknown>
}

const fetcher = <T,>(url: string): Promise<ApiResponse<T>> =>
  fetch(url).then((res) => res.json())

const ENGINE_FULL_KEYWORDS =
  /\b(PARTITION BY|PRIMARY KEY|ORDER BY|TTL|SETTINGS|SAMPLE BY)\b/g

function formatEngineFull(engineFull: string): string {
  return engineFull.replace(ENGINE_FULL_KEYWORDS, '\n$1')
}

export function IndexesTab() {
  const hostId = useHostId()
  const { database, table } = useExplorerState()

  // Fetch indexes data
  const {
    data: indexesResponse,
    error: indexesError,
    isLoading: indexesLoading,
  } = useSWR<ApiResponse<IndexesData[]>>(
    database && table
      ? `/api/v1/explorer/indexes?hostId=${hostId}&database=${encodeURIComponent(database)}&table=${encodeURIComponent(table)}`
      : null,
    fetcher<IndexesData[]>
  )

  // Fetch skip indexes data
  const {
    data: skipIndexesResponse,
    error: skipIndexesError,
    isLoading: skipIndexesLoading,
  } = useSWR<ApiResponse<SkipIndexData[]>>(
    database && table
      ? `/api/v1/explorer/skip-indexes?hostId=${hostId}&database=${encodeURIComponent(database)}&table=${encodeURIComponent(table)}`
      : null,
    fetcher<SkipIndexData[]>
  )

  // Fetch projections data
  const {
    data: projectionsResponse,
    error: projectionsError,
    isLoading: projectionsLoading,
  } = useSWR<ApiResponse<ProjectionData[]>>(
    database && table
      ? `/api/v1/explorer/projections?hostId=${hostId}&database=${encodeURIComponent(database)}&table=${encodeURIComponent(table)}`
      : null,
    fetcher<ProjectionData[]>
  )

  const indexData = indexesResponse?.data?.[0]
  const skipIndexes = skipIndexesResponse?.data || []
  const projections = projectionsResponse?.data || []

  if (!database || !table) {
    return null
  }

  const isLoading = indexesLoading || projectionsLoading
  const error = indexesError || projectionsError

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
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
            Failed to load data: {error.message}
          </div>
        </CardContent>
      </Card>
    )
  }

  const keyFields = [
    {
      label: 'Partition Key',
      value: indexData?.partition_key,
      icon: <Database className="size-4" />,
    },
    {
      label: 'Sorting Key',
      value: indexData?.sorting_key,
      icon: <Key className="size-4" />,
    },
    {
      label: 'Primary Key',
      value: indexData?.primary_key,
      icon: <Key className="size-4" />,
    },
    {
      label: 'Sampling Key',
      value: indexData?.sampling_key,
      icon: <Settings className="size-4" />,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Engine Info */}
      {indexData?.engine && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="size-4" />
              Engine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-medium">{indexData.engine}</div>
              {indexData.engine_full &&
                indexData.engine_full !== indexData.engine && (
                  <pre className="overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 font-mono text-sm">
                    <code>{formatEngineFull(indexData.engine_full)}</code>
                  </pre>
                )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keys Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {keyFields.map(({ label, value, icon }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                {icon}
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {value ? (
                <pre className="overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 font-mono text-sm">
                  <code>{value}</code>
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">Not set</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Skip Indexes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="size-4" />
            Skip Indexes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {skipIndexesLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : skipIndexesError ? (
            <p className="text-sm text-muted-foreground">
              Skip indexes data unavailable
            </p>
          ) : skipIndexes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Expression</TableHead>
                  <TableHead>Granularity</TableHead>
                  <TableHead>Compressed</TableHead>
                  <TableHead>Uncompressed</TableHead>
                  <TableHead>Ratio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skipIndexes.map((idx) => (
                  <TableRow key={`${idx.name}-${idx.type}-${idx.expr}`}>
                    <TableCell className="font-medium">{idx.name}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {idx.type_full}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">{idx.expr}</code>
                    </TableCell>
                    <TableCell>{idx.granularity}</TableCell>
                    <TableCell>{idx.compressed_size}</TableCell>
                    <TableCell>{idx.uncompressed_size}</TableCell>
                    <TableCell>{idx.compression_ratio}x</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No skip indexes defined for this table
            </p>
          )}
        </CardContent>
      </Card>

      {/* Projections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="size-4" />
            Projections
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projections.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Compressed</TableHead>
                  <TableHead>Uncompressed</TableHead>
                  <TableHead>Ratio</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Parts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projections.map((proj) => (
                  <TableRow key={proj.name}>
                    <TableCell className="font-medium">{proj.name}</TableCell>
                    <TableCell>{proj.compressed_size}</TableCell>
                    <TableCell>{proj.uncompressed_size}</TableCell>
                    <TableCell>{proj.compression_ratio}x</TableCell>
                    <TableCell>{proj.rows}</TableCell>
                    <TableCell>{proj.parts}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No projections defined for this table
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
