'use client'

import { createPage } from '@/lib/create-page'
import { runningQueriesConfig } from '@/lib/query-config/queries/running-queries'

export default createPage({
  queryConfig: runningQueriesConfig,
  title: 'Running Queries',
  enableRowSelection: true,
})
