import { createFileRoute } from '@tanstack/react-router'
import { createPage } from '@/lib/create-page'
import { projectionsConfig } from '@/lib/query-config/tables/projections'

const ProjectionsPage = createPage({
  queryConfig: projectionsConfig,
  title: 'Projections',
})


export const Route = createFileRoute('/(dashboard)/projections')({
  component: ProjectionsPage,
})
