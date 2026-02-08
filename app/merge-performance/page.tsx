'use client'

import { createPage } from '@/lib/create-page'
import { mergePerformanceConfig } from '@/lib/query-config/merges/merge-performance'

export default createPage({
  queryConfig: mergePerformanceConfig,
  title: 'Merge Performance',
})
