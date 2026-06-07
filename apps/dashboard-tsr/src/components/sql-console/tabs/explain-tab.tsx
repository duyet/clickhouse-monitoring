import { AlertCircle } from 'lucide-react'

import { useExplain } from '../hooks/use-explain'
import { ExplainResult } from '@/components/explain/explain-result'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

export function ExplainTab({
  hostId,
  sql,
  active,
}: {
  hostId: number
  sql: string | null
  active: boolean
}) {
  const { data, error, isFetching } = useExplain(hostId, sql, active)

  if (!sql) {
    return (
      <div className="text-muted-foreground p-8 text-center text-sm">
        Run a query to see its execution plan.
      </div>
    )
  }

  if (isFetching && !data) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>EXPLAIN failed</AlertTitle>
        <AlertDescription className="mt-1 font-mono text-xs whitespace-pre-wrap">
          {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <ExplainResult
      lines={data ?? []}
      title="Query plan (EXPLAIN indexes = 1)"
      treeRenderable
    />
  )
}
