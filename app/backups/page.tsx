'use client'

import { createPage } from '@/lib/create-page'
import { backupsConfig } from '@/lib/query-config/more/backups'

export default createPage({
  queryConfig: backupsConfig,
  title: 'Backups',
})
