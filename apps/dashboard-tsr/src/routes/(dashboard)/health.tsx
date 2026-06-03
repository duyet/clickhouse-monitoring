import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { HealthGrid } from '@/components/health/health-grid'
import { HealthSettingsDialog } from '@/components/health/health-settings-dialog'
import { PageHeader } from '@/components/layout'
import { ChartSkeleton } from '@/components/skeletons'

function HealthPageContent() {
  return (
    <div className="flex flex-col gap-6">
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
    <Suspense fallback={<ChartSkeleton />}>
      <HealthPageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/health')({
  component: HealthPage,
})
