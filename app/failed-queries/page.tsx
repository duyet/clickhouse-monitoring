'use client'

import { createPage } from '@/lib/create-page'
import { failedQueriesConfig } from '@/lib/query-config/queries/failed-queries'

export default createPage({
  queryConfig: failedQueriesConfig,
  title: 'Failed Queries',
})
