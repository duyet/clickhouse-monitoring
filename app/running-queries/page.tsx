'use client'

import { PageLayout } from '@/components/layout/query-page'
import { runningQueriesConfig } from '@/lib/query-config/queries/running-queries'

export default function RunningQueriesPage() {
  return (
    <PageLayout queryConfig={runningQueriesConfig} title="Running Queries" />
  )
}
