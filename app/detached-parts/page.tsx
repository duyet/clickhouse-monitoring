'use client'

export const dynamic = 'force-static'

import { createPage } from '@/lib/create-page'
import { detachedPartsConfig } from '@/lib/query-config/tables/detached-parts'

export default createPage({
  queryConfig: detachedPartsConfig,
  title: 'Detached Parts',
})
