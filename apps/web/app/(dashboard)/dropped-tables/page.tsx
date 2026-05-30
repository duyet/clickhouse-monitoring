'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { droppedTablesConfig } from '@/lib/query-config/tables/dropped-tables'

function DroppedTablesPageContent() {
  return <PageLayout queryConfig={droppedTablesConfig} title="Dropped Tables" />
}

export default function DroppedTablesPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <DroppedTablesPageContent />
    </Suspense>
  )
}
