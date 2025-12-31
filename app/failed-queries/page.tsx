'use client'

import { PageLayout } from '@/components/layout/query-page'
import { failedQueriesConfig } from '@/lib/query-config/queries/failed-queries'

export default function FailedQueriesPage() {
  return <PageLayout queryConfig={failedQueriesConfig} title="Failed Queries" />
}
