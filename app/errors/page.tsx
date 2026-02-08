'use client'

import { createPage } from '@/lib/create-page'
import { errorsConfig } from '@/lib/query-config/more/errors'

export default createPage({
  queryConfig: errorsConfig,
  title: 'Errors',
})
