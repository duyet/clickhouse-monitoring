'use client'

import { createPage } from '@/lib/create-page'
import { topUsageColumnsConfig } from '@/lib/query-config/more/top-usage-columns'

export default createPage({
  queryConfig: topUsageColumnsConfig,
  title: 'Top Usage Columns',
})
