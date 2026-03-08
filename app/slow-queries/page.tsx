'use client'

import { createPage } from '@/lib/create-page'
import { slowQueriesConfig } from '@/lib/query-config/queries/slow-queries'

export default createPage({
  queryConfig: slowQueriesConfig,
  title: 'Slow Queries',
})
