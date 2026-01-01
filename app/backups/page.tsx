'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { backupsConfig } from '@/lib/query-config/more/backups'

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
