import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { textLogConfig } from '@/lib/query-config/logs/text-log'

function TextLogContent() {
  return <PageLayout queryConfig={textLogConfig} title="Server Text Log" />
}

function TextLogPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <TextLogContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/logs/text-log')({
  component: TextLogPage,
})
