'use client'

import { createPage } from '@/lib/create-page'
import { mergeTreeSettingsConfig } from '@/lib/query-config/more/mergetree-settings'

export default createPage({
  queryConfig: mergeTreeSettingsConfig,
  title: 'MergeTree Settings',
})
