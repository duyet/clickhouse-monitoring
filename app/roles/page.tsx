'use client'

export const dynamic = 'force-static'

import { createPage } from '@/lib/create-page'
import { rolesConfig } from '@/lib/query-config/more/roles'

export default createPage({
  queryConfig: rolesConfig,
  title: 'Roles',
})
