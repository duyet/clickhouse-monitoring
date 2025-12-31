'use client'

import { createPage } from '@/lib/create-page'
import { projectionsConfig } from '@/lib/query-config/tables/projections'

export default createPage({
  queryConfig: projectionsConfig,
  title: 'Projections',
})
