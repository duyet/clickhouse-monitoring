'use client'

import { createPage } from '@/lib/create-page'
import { sessionsConfig } from '@/lib/query-config/security/sessions'

export default createPage({
  queryConfig: sessionsConfig,
  title: 'User Sessions',
})
