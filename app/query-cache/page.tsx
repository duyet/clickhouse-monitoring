'use client'

import { createPage } from '@/lib/create-page'
import { queryCacheConfig } from '@/lib/query-config/queries/query-cache'

export default createPage({
  queryConfig: queryCacheConfig,
  title: 'Query Cache',
})
