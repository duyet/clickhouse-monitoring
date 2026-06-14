import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { RunningQueriesPageSkeleton } from '@/components/query-tables/query-page-skeleton'
import { RunningQueriesView } from '@/components/running-queries'
import { pageOgHead } from '@/lib/og'

/**
 * Running Queries page.
 *
 * {@link RunningQueriesView} is self-contained — it renders its own header,
 * the collapsible chart strip and the query table — so the page just wraps it
 * in a Suspense boundary. The fallback reserves space for the full layout
 * (header + charts + table + completed table) to avoid a CLS flash.
 */
function RunningQueriesPage() {
  return (
    <Suspense fallback={<RunningQueriesPageSkeleton />}>
      <RunningQueriesView />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/running-queries')({
  component: RunningQueriesPage,
  head: () => pageOgHead('running-queries'),
})
