'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { backupsConfig } from '@/lib/query-config/more/backups'
import { ChartSkeleton } from '@/components/skeletons'

function BackupsPageContent() {
  return <PageLayout queryConfig={backupsConfig} title="Backups" />
}

export default function BackupsPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <BackupsPageContent />
    </Suspense>
  )
}
