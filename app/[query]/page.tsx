import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'

import { RelatedCharts } from '@/components/related-charts'

import { ChartSkeleton, TableSkeleton } from '@/components/skeleton'
import { Suspense } from 'react'
import { getQueryConfigByName } from './clickhouse-queries'
import Table from './table'

interface PageProps {
  params: {
    query: string
  }
  searchParams: { [key: string]: string | string[] | undefined }
}

export const dynamic = 'force-dynamic'
export const revalidate = 30

export default async function Page({
  params: { query },
  searchParams,
}: PageProps) {
  noStore()

  // Get the query config
  const config = getQueryConfigByName(query)
  if (!config) {
    return notFound()
  }

  return (
    <div className="flex flex-col">
      <Suspense fallback={<ChartSkeleton />}>
        <RelatedCharts relatedCharts={config.relatedCharts} />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <Table
          title={query.replaceAll('-', ' ')}
          config={config}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  )
}
