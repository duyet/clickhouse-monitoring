'use client'

import { createPage } from '@/lib/create-page'
import { settingsConfig } from '@/lib/query-config/more/settings'

export default createPage({
  queryConfig: settingsConfig,
  title: 'Settings',
})
