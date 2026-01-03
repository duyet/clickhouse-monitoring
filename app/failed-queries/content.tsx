'use client'

import { PageLayout } from '@/components/layout/query-page'
import { failedQueriesConfig } from '@/lib/query-config/queries/failed-queries'

export function FailedQueriesPageContent() {
  return <PageLayout queryConfig={failedQueriesConfig} title="Failed Queries" />
}
