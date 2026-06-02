'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { readOnlyTablesConfig } from '@/lib/query-config/tables/readonly-tables'

function ReadonlyTablesPageContent() {
  return (
    <PageLayout queryConfig={readOnlyTablesConfig} title="Readonly Tables" />
  )
}

export default function ReadonlyTablesPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ReadonlyTablesPageContent />
    </Suspense>
  )
}
