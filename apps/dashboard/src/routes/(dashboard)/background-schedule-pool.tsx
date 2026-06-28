import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { PageSkeleton } from '@/components/skeletons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { pageOgHead } from '@/lib/og'
import { backgroundSchedulePoolConfig } from '@/lib/query-config/system/background-schedule-pool'
import { backgroundSchedulePoolLogConfig } from '@/lib/query-config/system/background-schedule-pool-log'

function BgSchedulePoolPageContent() {
  return (
    <Tabs defaultValue="live" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="live">Live Tasks</TabsTrigger>
        <TabsTrigger value="history">Task History</TabsTrigger>
      </TabsList>
      <TabsContent value="live">
        <PageLayout
          queryConfig={backgroundSchedulePoolConfig}
          title="Background Schedule Pool"
          description="Active and upcoming background scheduled tasks (CH 25.12+)"
        />
      </TabsContent>
      <TabsContent value="history">
        <PageLayout
          queryConfig={backgroundSchedulePoolLogConfig}
          title="Background Schedule Pool Log"
        />
      </TabsContent>
    </Tabs>
  )
}

function BgSchedulePoolPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BgSchedulePoolPageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/background-schedule-pool')({
  component: BgSchedulePoolPage,
  head: () => pageOgHead('background-schedule-pool'),
})
