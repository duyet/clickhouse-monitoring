import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { PageSkeleton } from '@/components/skeletons'
import { droppedTablesConfig } from '@/lib/query-config/tables/dropped-tables'

function DroppedTablesPageContent() {
  return <PageLayout queryConfig={droppedTablesConfig} title="Dropped Tables" />
}

function DroppedTablesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DroppedTablesPageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/dropped-tables')({
  component: DroppedTablesPage,
})
