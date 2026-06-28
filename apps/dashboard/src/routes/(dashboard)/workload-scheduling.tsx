import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { PageSkeleton } from '@/components/skeletons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { pageOgHead } from '@/lib/og'
import { schedulerConfig } from '@/lib/query-config/system/scheduler'
import { workloadsConfig } from '@/lib/query-config/system/workloads'

function WorkloadSchedulingPageContent() {
  return (
    <Tabs defaultValue="workloads" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="workloads">Workloads</TabsTrigger>
        <TabsTrigger value="scheduler">Scheduler State</TabsTrigger>
      </TabsList>
      <TabsContent value="workloads">
        <PageLayout
          queryConfig={workloadsConfig}
          title="Workload Hierarchy"
          description="SQL resource scheduling workload definitions: weights, priorities, and concurrency caps (CH 25.4+)."
        />
      </TabsContent>
      <TabsContent value="scheduler">
        <PageLayout
          queryConfig={schedulerConfig}
          title="Scheduler State"
          description="Real-time resource scheduler node state: in-flight, queued, throttled, and budget per workload path (CH 25.4+)."
        />
      </TabsContent>
    </Tabs>
  )
}

function WorkloadSchedulingPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <WorkloadSchedulingPageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/workload-scheduling')({
  component: WorkloadSchedulingPage,
  head: () => pageOgHead('workload-scheduling'),
})
