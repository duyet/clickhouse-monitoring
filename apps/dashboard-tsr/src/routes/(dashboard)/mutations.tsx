import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { QueryPageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { mutationsConfig } from '@/lib/query-config/merges/mutations'

function MutationsPageContent() {
  return <QueryPageLayout queryConfig={mutationsConfig} />
}

function MutationsPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <MutationsPageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/mutations')({
  component: MutationsPage,
})
