'use client'

import { createPage } from '@/lib/create-page'
import { parallelizationConfig } from '@/lib/query-config/queries/parallelization'

export default createPage({
  queryConfig: parallelizationConfig,
  title: 'Query Parallelization',
})
