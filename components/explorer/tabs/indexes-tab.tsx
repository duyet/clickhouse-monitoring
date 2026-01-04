'use client'

import { Database, Key, Layers, Settings } from 'lucide-react'
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
                    <code>{indexData.engine_full}</code>
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
