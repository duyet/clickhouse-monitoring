'use client'

import { Suspense } from 'react'
import { HealthGrid } from '@/components/health/health-grid'
import { HealthSettingsDialog } from '@/components/health/health-settings-dialog'
import { ChartSkeleton } from '@/components/skeletons'

function HealthPageContent() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Health Summary</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time health indicators for your ClickHouse cluster
          </p>
        </div>
        <HealthSettingsDialog />
      </div>
      <HealthGrid />
    </div>
  )
}

export default function HealthPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HealthPageContent />
    </Suspense>
  )
}
