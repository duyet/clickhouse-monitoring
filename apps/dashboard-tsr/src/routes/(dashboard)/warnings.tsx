import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { warningsConfig } from '@/lib/query-config/system/warnings'

function WarningsPageContent() {
  return <PageLayout queryConfig={warningsConfig} title="Warnings" />
}

function WarningsPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <WarningsPageContent />
    </Suspense>
  )
}


export const Route = createFileRoute('/(dashboard)/warnings')({
  component: WarningsPage,
})
