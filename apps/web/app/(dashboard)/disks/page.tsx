'use client'

import { createPage } from '@/lib/create-page'
import { diskSpaceConfig } from '@/lib/query-config/system/disks'

export default createPage({
  queryConfig: diskSpaceConfig,
  title: 'Disks',
})
