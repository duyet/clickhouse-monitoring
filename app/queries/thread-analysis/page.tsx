'use client'

import { createPage } from '@/lib/create-page'
import { threadAnalysisConfig } from '@/lib/query-config/queries/thread-analysis'

export default createPage({
  queryConfig: threadAnalysisConfig,
  title: 'Thread Analysis',
})
