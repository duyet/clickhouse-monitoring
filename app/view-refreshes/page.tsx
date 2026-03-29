'use client'

export const dynamic = 'force-static'

import { createPage } from '@/lib/create-page'
import { viewRefreshesConfig } from '@/lib/query-config/tables/view-refreshes'

export default createPage({
  queryConfig: viewRefreshesConfig,
  title: 'View Refreshes',
})
