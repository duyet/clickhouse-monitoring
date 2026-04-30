'use client'

export const dynamic = 'force-static'

import { createPage } from '@/lib/create-page'
import { queryViewsLogConfig } from '@/lib/query-config/queries/query-views-log'

export default createPage({
  queryConfig: queryViewsLogConfig,
  title: 'Query Views Log',
})
