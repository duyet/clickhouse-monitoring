'use client'

import { createPage } from '@/lib/create-page'
import { viewRefreshesConfig } from '@/lib/query-config/tables/view-refreshes'

export default createPage({
  queryConfig: viewRefreshesConfig,
  title: 'View Refreshes',
})
