'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { sessionsConfig } from '@/lib/query-config/security/sessions'

function SessionsContent() {
  return <PageLayout queryConfig={sessionsConfig} title="User Sessions" />
}

export default function SessionsPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <SessionsContent />
    </Suspense>
  )
}
