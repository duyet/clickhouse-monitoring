'use client'

import { PageLayout } from '@/components/page-layout'
import { failedQueriesConfig } from '@/lib/query-config/queries/failed-queries'

export default function FailedQueriesPage() {
  return <PageLayout queryConfig={failedQueriesConfig} title="Failed Queries" />
}
