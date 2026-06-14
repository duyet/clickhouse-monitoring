import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { HealthGrid } from '@/components/health/health-grid'
import { HealthSettingsDialog } from '@/components/health/health-settings-dialog'
import { PageHeader } from '@/components/layout'
import { ChartsOnlyPageSkeleton } from '@/components/skeletons'

function HealthPageContent() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <PageHeader
        title="Health Summary"
        description="Real-time health indicators for your ClickHouse cluster"
        actions={<HealthSettingsDialog />}
      />
      <HealthGrid />
    </div>
  )
}

function HealthPage() {
  return (
    <Suspense fallback={<ChartsOnlyPageSkeleton chartCount={8} />}>
      <HealthPageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/health')({
  component: HealthPage,
})
