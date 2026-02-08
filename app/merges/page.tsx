'use client'

import { createPage } from '@/lib/create-page'
import { mergesConfig } from '@/lib/query-config/merges/merges'

export default createPage({
  queryConfig: mergesConfig,
  title: 'Merges',
})
