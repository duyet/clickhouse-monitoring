import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { crashLogConfig } from '@/lib/query-config/logs/crashes'

function CrashesContent() {
  return <PageLayout queryConfig={crashLogConfig} title="Crash Log" />
}

function CrashesPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <CrashesContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/logs/crashes')({
  component: CrashesPage,
})
