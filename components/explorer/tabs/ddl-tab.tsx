'use client'

import { Check, Copy } from 'lucide-react'
import useSWR from 'swr'

import { useExplorerState } from '../hooks/use-explorer-state'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useHostId } from '@/lib/swr/use-host'

interface DdlRow {
  create_table_query: string
}

interface ApiResponse<T> {
  data: T
  metadata?: Record<string, unknown>
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function DdlTab() {
  const hostId = useHostId()
  const { database, table } = useExplorerState()
  const [copied, setCopied] = useState(false)

  const {
    data: response,
    error,
    isLoading,
  } = useSWR<ApiResponse<DdlRow[]>>(
    database && table
      ? `/api/v1/explorer/ddl?hostId=${hostId}&database=${encodeURIComponent(database)}&table=${encodeURIComponent(table)}`
      : null,
    fetcher
  )

  const ddl = response?.data?.[0]?.create_table_query

  const handleCopy = async () => {
    if (ddl) {
      await navigator.clipboard.writeText(ddl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!database || !table) {
    return null
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Table DDL</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Table DDL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">
            Failed to load DDL: {error.message}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Table DDL</CardTitle>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? (
            <>
              <Check className="mr-2 size-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="mr-2 size-4" />
              Copy
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <pre className="overflow-auto rounded-md bg-muted p-4 text-sm">
          <code>{ddl}</code>
        </pre>
      </CardContent>
    </Card>
  )
}
