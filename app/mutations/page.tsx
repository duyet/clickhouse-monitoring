'use client'

import { createPage } from '@/lib/create-page'
import { mutationsConfig } from '@/lib/query-config/merges/mutations'

export default createPage({
  queryConfig: mutationsConfig,
  title: 'Mutations',
})
