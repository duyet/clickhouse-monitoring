'use client'

export const dynamic = 'force-static'

import { createPage } from '@/lib/create-page'
import { mergeTreeSettingsConfig } from '@/lib/query-config/more/mergetree-settings'

export default createPage({
  queryConfig: mergeTreeSettingsConfig,
  title: 'MergeTree Settings',
})
