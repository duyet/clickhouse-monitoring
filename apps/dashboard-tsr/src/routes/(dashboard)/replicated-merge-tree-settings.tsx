import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { replicatedMergeTreeSettingsConfig } from '@/lib/query-config/system/replicated-merge-tree-settings'

function ReplicatedMergeTreeSettingsPageContent() {
  return (
    <PageLayout
      queryConfig={replicatedMergeTreeSettingsConfig}
      title="Replicated MergeTree Settings"
    />
  )
}

function ReplicatedMergeTreeSettingsPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ReplicatedMergeTreeSettingsPageContent />
    </Suspense>
  )
}


export const Route = createFileRoute('/(dashboard)/replicated-merge-tree-settings')({
  component: ReplicatedMergeTreeSettingsPage,
})
