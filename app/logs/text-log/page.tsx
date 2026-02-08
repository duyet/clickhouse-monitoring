'use client'

import { createPage } from '@/lib/create-page'
import { textLogConfig } from '@/lib/query-config/logs/text-log'

export default createPage({
  queryConfig: textLogConfig,
  title: 'Server Text Log',
})
