'use client'

import { createPage } from '@/lib/create-page'
import { metricsConfig } from '@/lib/query-config/more/metrics'

export default createPage({
  queryConfig: metricsConfig,
  title: 'Metrics',
})
