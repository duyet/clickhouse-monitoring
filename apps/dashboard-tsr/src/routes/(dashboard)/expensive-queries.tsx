import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { ExpensiveQueriesView } from '@/components/expensive-queries'
import { ChartSkeleton } from '@/components/skeletons'

/**
 * Most Expensive Queries page.
 *
 * {@link ExpensiveQueriesView} is self-contained — it renders its own header,
 * the collapsible related-charts strip and the bespoke expensive-queries
 * table — so the page just wraps it in a Suspense boundary.
 */
function ExpensiveQueriesPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ExpensiveQueriesView />
    </Suspense>
  )
}


export const Route = createFileRoute('/(dashboard)/expensive-queries')({
  component: ExpensiveQueriesPage,
})
