'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { sessionsConfig } from '@/lib/query-config/security/sessions'

function AuditLogContent() {
  return <PageLayout queryConfig={sessionsConfig} title="Audit Log" />
}

export default function AuditLogPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <AuditLogContent />
    </Suspense>
  )
}
