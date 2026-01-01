'use client'

import useSWR from 'swr'

import { useExplorerState } from '../hooks/use-explorer-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useHostId } from '@/lib/swr/use-host'

interface IndexesData {
  partition_key: string
  sorting_key: string
  primary_key: string
  sampling_key: string
}

interface ApiResponse<T> {
  data: T
  metadata?: Record<string, unknown>
}

const fetcher = (url: string): Promise<ApiResponse<IndexesData[]>> =>
  fetch(url).then((res) => res.json())

export function IndexesTab() {
  const hostId = useHostId()
  const { database, table } = useExplorerState()

  const {
    data: response,
    error,
    isLoading,
  } = useSWR<ApiResponse<IndexesData[]>>(
    database && table
      ? `/api/v1/explorer/indexes?hostId=${hostId}&database=${encodeURIComponent(database)}&table=${encodeURIComponent(table)}`
      : null,
    fetcher
  )

  const data = response?.data?.[0]

  if (!database || !table) {
    return null
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-destructive">
            Failed to load indexes: {error.message}
          </div>
        </CardContent>
      </Card>
    )
  }

  const indexFields = [
    { label: 'Partition Key', value: data?.partition_key },
    { label: 'Sorting Key', value: data?.sorting_key },
    { label: 'Primary Key', value: data?.primary_key },
    { label: 'Sampling Key', value: data?.sampling_key },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {indexFields.map(({ label, value }) => (
        <Card key={label}>
          <CardHeader>
            <CardTitle className="text-base">{label}</CardTitle>
          </CardHeader>
          <CardContent>
            {value ? (
              <pre className="overflow-auto rounded-md bg-muted p-3 text-sm">
                <code>{value}</code>
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">Not set</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
