import { Suspense } from 'react'

import { ClickHouseInfo } from '@/components/charts/overview'
import { MultiLineSkeleton } from '@/components/skeleton'
import { UIInfo } from './ui-info'

export const dynamic = 'force-static'

export default async function About() {
  return (
    <div className="container mx-auto flex flex-col gap-8 px-4 py-8 md:flex-row">
      <UIInfo />

      <Suspense fallback={<MultiLineSkeleton />}>
        <ClickHouseInfo
          className="max-w-md min-w-md content-normal"
          contentClassName="p-6 pt-0 gap-2"
          title="ClickHouse Cluster Info"
          description="Server Version and Uptime"
          uptime
          version
          hostName
          currentUser
        />
      </Suspense>
    </div>
  )
}
