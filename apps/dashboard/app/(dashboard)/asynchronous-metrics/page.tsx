'use client'

import { createPage } from '@/lib/create-page'
import { asynchronousMetricsConfig } from '@/lib/query-config/more/asynchronous-metrics'

export default createPage({
  queryConfig: asynchronousMetricsConfig,
  title: 'Asynchronous Metrics',
})
