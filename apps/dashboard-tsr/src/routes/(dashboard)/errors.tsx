import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { errorsConfig } from '@/lib/query-config/more/errors'

function ErrorsPageContent() {
  return <PageLayout queryConfig={errorsConfig} title="Errors" />
}

function ErrorsPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ErrorsPageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/errors')({
  component: ErrorsPage,
})
