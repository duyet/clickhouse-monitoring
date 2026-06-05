import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { PageSkeleton } from '@/components/skeletons'
import { replicasConfig } from '@/lib/query-config/tables/replicas'

function ReplicasPageContent() {
  return <PageLayout queryConfig={replicasConfig} title="Table Replicas" />
}

function ReplicasPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ReplicasPageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/replicas')({
  component: ReplicasPage,
})
