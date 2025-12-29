import { Suspense } from 'react'

import { ClickHouseInfo } from '@/components/overview-charts/clickhouse-info'
import { MultiLineSkeleton } from '@/components/skeleton'
import { UIInfo } from './ui-info'

export const dynamic = 'force-static'

export default async function About({
  params,
}: {
  params: Promise<{ host: string }>
}) {
  const { host } = await params
  const hostId = Number(host)

  return (
    <div className="container mx-auto flex flex-col gap-8 px-4 py-8 md:flex-row">
      <UIInfo />

      <Suspense fallback={<MultiLineSkeleton />}>
        <ClickHouseInfo
          hostId={hostId}
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
