import { createFileRoute } from '@tanstack/react-router'

import { createPage } from '@/lib/create-page'
import { tablesOverviewConfig } from '@/lib/query-config/tables/tables-overview'

const TablesOverviewPage = createPage({
  queryConfig: tablesOverviewConfig,
  title: 'Tables Overview',
})

export const Route = createFileRoute('/(dashboard)/tables-overview')({
  component: TablesOverviewPage,
})
