'use client'

import { createPage } from '@/lib/create-page'
import { crashLogConfig } from '@/lib/query-config/logs/crashes'

export default createPage({
  queryConfig: crashLogConfig,
  title: 'Crash Log',
})
