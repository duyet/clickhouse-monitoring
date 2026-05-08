'use client'

import { createPage } from '@/lib/create-page'
import { rolesConfig } from '@/lib/query-config/more/roles'

export default createPage({
  queryConfig: rolesConfig,
  title: 'Roles',
})
