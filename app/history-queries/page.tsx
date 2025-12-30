'use client'

import { PageLayout } from '@/components/page-layout'
import { historyQueriesConfig } from '@/lib/query-config/queries/history-queries'

export default function HistoryQueriesPage() {
  return (
    <PageLayout queryConfig={historyQueriesConfig} title="History Queries" />
  )
}
