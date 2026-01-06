'use client'

import { createPage } from '@/lib/create-page'
import { tablesOverviewConfig } from '@/lib/query-config/tables/tables-overview'

export default createPage({
  queryConfig: tablesOverviewConfig,
  title: 'Tables Overview',
})
