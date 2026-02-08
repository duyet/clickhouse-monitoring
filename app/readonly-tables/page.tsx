'use client'

import { createPage } from '@/lib/create-page'
import { readOnlyTablesConfig } from '@/lib/query-config/tables/readonly-tables'

export default createPage({
  queryConfig: readOnlyTablesConfig,
  title: 'Readonly Tables',
})
