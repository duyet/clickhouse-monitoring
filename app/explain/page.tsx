'use client'

import { InfoCircledIcon } from '@radix-ui/react-icons'
import useSWR from 'swr'

import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useState } from 'react'
import { ErrorAlert } from '@/components/feedback'
import { ChartSkeleton } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useHostId } from '@/lib/swr'
import { cn } from '@/lib/utils'

interface ExplainResult {
  explain: string
}

interface ApiResponse {
  data: ExplainResult[]
  metadata: { sql: string }
}

const fetcher = async (url: string): Promise<ApiResponse> => {
  const res = await fetch(url)
  if (!res.ok) {
    const errorData = (await res.json()) as { error?: { message?: string } }
    throw new Error(errorData.error?.message || 'Failed to explain query')
  }
  return res.json() as Promise<ApiResponse>
}

function ExplainContent() {
  const hostId = useHostId()
  const searchParams = useSearchParams()
  const queryFromUrl = searchParams.get('query') || ''

  const [queryInput, setQueryInput] = useState(queryFromUrl)
  const [queryToExplain, setQueryToExplain] = useState(queryFromUrl)

  const { data, error, isLoading } = useSWR<ApiResponse>(
    queryToExplain
      ? `/api/v1/explain?hostId=${hostId}&query=${encodeURIComponent(queryToExplain)}`
      : null,
    fetcher
  )

  const handleExplain = useCallback(() => {
    setQueryToExplain(queryInput)
  }, [queryInput])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleExplain()
      }
    },
    [handleExplain]
  )

  return (
    <div className="flex flex-col gap-4">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <InfoCircledIcon className="size-5" />
            Explain Query
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Enter SQL query to explain..."
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={5}
              className="font-mono text-sm"
            />
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs">
                Press Cmd/Ctrl + Enter to explain
              </p>
              <Button onClick={handleExplain} disabled={!queryInput.trim()}>
                Explain
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && <ChartSkeleton />}

      {error && (
        <ErrorAlert
          title="Failed to explain query"
          message={error instanceof Error ? error.message : String(error)}
        />
      )}

      {data?.data && data.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Execution Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <pre
              className={cn(
                'bg-muted overflow-x-auto rounded-md p-4',
                'font-mono text-sm whitespace-pre-wrap'
              )}
            >
              {data.data.map((row) => row.explain).join('\n')}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function ExplainPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ExplainContent />
    </Suspense>
  )
}
