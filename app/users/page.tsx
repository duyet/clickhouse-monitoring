'use client'

export const dynamic = 'force-static'

import { createPage } from '@/lib/create-page'
import { usersConfig } from '@/lib/query-config/more/users'

export default createPage({
  queryConfig: usersConfig,
  title: 'Users',
})
