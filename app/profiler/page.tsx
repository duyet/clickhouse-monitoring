'use client'

import { createPage } from '@/lib/create-page'
import { profilerConfig } from '@/lib/query-config/queries/profiler'

export default createPage({
  queryConfig: profilerConfig,
  title: 'Query Profiler',
})
