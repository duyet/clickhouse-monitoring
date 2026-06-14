import { createFileRoute } from '@tanstack/react-router'

import { createPage } from '@/lib/create-page'
import { pageOgHead } from '@/lib/og'
import { usersConfig } from '@/lib/query-config/more/users'

const UsersPage = createPage({
  queryConfig: usersConfig,
  title: 'Users',
})

export const Route = createFileRoute('/(dashboard)/users')({
  component: UsersPage,
  head: () => pageOgHead('users'),
})
