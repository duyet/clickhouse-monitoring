'use client'

import { createPage } from '@/lib/create-page'
import { stackTracesConfig } from '@/lib/query-config/logs/stack-traces'

export default createPage({
  queryConfig: stackTracesConfig,
  title: 'Current Stack Traces',
})
