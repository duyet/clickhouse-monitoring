'use client'

import { PageLayout } from '@/components/layout/query-page'
import { historyQueriesConfig } from '@/lib/query-config/queries/history-queries'

export default function HistoryQueriesPage() {
  return (
    <PageLayout queryConfig={historyQueriesConfig} title="History Queries" />
  )
}
