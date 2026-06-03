import { createFileRoute } from '@tanstack/react-router'
import { createPage } from '@/lib/create-page'
import { viewRefreshesConfig } from '@/lib/query-config/tables/view-refreshes'

const ViewRefreshesPage = createPage({
  queryConfig: viewRefreshesConfig,
  title: 'View Refreshes',
})


export const Route = createFileRoute('/(dashboard)/view-refreshes')({
  component: ViewRefreshesPage,
})
