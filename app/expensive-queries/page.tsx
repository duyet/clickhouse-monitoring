'use client'

import { createPage } from '@/lib/create-page'
import { expensiveQueriesConfig } from '@/lib/query-config/queries/expensive-queries'

export default createPage({
  queryConfig: expensiveQueriesConfig,
  title: 'Most Expensive Queries',
})
