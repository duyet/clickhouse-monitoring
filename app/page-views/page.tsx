'use client'

import { createPage } from '@/lib/create-page'
import { pageViewsConfig } from '@/lib/query-config/more/page-views'

export default createPage({
  queryConfig: pageViewsConfig,
  title: 'Page Views',
})
