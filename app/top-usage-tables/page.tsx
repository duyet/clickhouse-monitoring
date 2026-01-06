'use client'

import { createPage } from '@/lib/create-page'
import { topUsageTablesConfig } from '@/lib/query-config/more/top-usage-tables'

export default createPage({
  queryConfig: topUsageTablesConfig,
  title: 'Top Usage Tables',
})
