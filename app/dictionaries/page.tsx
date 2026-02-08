'use client'

import { createPage } from '@/lib/create-page'
import { dictionariesConfig } from '@/lib/query-config/more/dictionaries'

export default createPage({
  queryConfig: dictionariesConfig,
  title: 'Dictionaries',
})
