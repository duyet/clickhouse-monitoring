'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { errorsConfig } from '@/lib/query-config/more/errors'

function ErrorsPageContent() {
  return <PageLayout queryConfig={errorsConfig} title="Errors" />
}

export default function ErrorsPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ErrorsPageContent />
    </Suspense>
  )
}
