'use client'

import { createPage } from '@/lib/create-page'
import { replicasConfig } from '@/lib/query-config/tables/replicas'

export default createPage({
  queryConfig: replicasConfig,
  title: 'Table Replicas',
})
