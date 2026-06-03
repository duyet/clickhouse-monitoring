import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { RunningQueriesView } from '@/components/running-queries'
import { ChartSkeleton } from '@/components/skeletons'

/**
 * Running Queries page.
 *
 * {@link RunningQueriesView} is self-contained — it renders its own header,
 * the collapsible chart strip and the query table — so the page just wraps it
 * in a Suspense boundary.
 */
function RunningQueriesPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <RunningQueriesView />
    </Suspense>
  )
}


export const Route = createFileRoute('/(dashboard)/running-queries')({
  component: RunningQueriesPage,
})
