import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { sessionsConfig } from '@/lib/query-config/security/sessions'

function SessionsContent() {
  return <PageLayout queryConfig={sessionsConfig} title="User Sessions" />
}

function SessionsPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <SessionsContent />
    </Suspense>
  )
}


export const Route = createFileRoute('/(dashboard)/security/sessions')({
  component: SessionsPage,
})
