'use client'

import { createPage } from '@/lib/create-page'
import { historyQueriesConfig } from '@/lib/query-config/queries/history-queries'

export default createPage({
  queryConfig: historyQueriesConfig,
  title: 'History Queries',
})
