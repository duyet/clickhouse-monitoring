'use client'

import { createPage } from '@/lib/create-page'
import { detachedPartsConfig } from '@/lib/query-config/tables/detached-parts'

export default createPage({
  queryConfig: detachedPartsConfig,
  title: 'Detached Parts',
})
