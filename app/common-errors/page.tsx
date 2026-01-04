'use client'

import { createPage } from '@/lib/create-page'
import { commonErrorsConfig } from '@/lib/query-config/queries/common-errors'

export default createPage({
  queryConfig: commonErrorsConfig,
  title: 'Latest Common Errors',
})
