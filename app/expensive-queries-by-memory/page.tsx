'use client'

export const dynamic = 'force-static'

import { createPage } from '@/lib/create-page'
import { expensiveQueriesByMemoryConfig } from '@/lib/query-config/queries/expensive-queries-by-memory'

export default createPage({
  queryConfig: expensiveQueriesByMemoryConfig,
  title: 'Most Expensive Queries by Memory',
})
