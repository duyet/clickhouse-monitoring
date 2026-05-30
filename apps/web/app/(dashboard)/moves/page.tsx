'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { movesConfig } from '@/lib/query-config/tables/moves'

function MovesPageContent() {
  return <PageLayout queryConfig={movesConfig} title="Moves" />
}

export default function MovesPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <MovesPageContent />
    </Suspense>
  )
}
