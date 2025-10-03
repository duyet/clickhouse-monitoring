import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { RelatedCharts } from '@/components/related-charts'
import { ChartSkeleton, TableSkeleton } from '@/components/skeleton'
import { Table } from '@/components/table'
import { getQueryConfigByName } from './clickhouse-queries'

interface PageProps {
  params: Promise<{
    host: string
    query: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 300

export default async function Page({ params, searchParams }: PageProps) {
  const { host, query } = await params
  const hostId = Number(host)

  // Retrieves the query configuration by name.
  const queryConfig = getQueryConfigByName(query)
  if (!queryConfig) {
    return notFound()
  }

  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<ChartSkeleton />}>
        <RelatedCharts relatedCharts={queryConfig.relatedCharts} hostId={hostId} />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <Table
          title={query.replaceAll('-', ' ')}
          queryConfig={queryConfig}
          searchParams={await searchParams}
        />
      </Suspense>
    </div>
  )
}
