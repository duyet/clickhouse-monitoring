import { createFileRoute } from '@tanstack/react-router'
import { createPage } from '@/lib/create-page'
import { detachedPartsConfig } from '@/lib/query-config/tables/detached-parts'

const DetachedPartsPage = createPage({
  queryConfig: detachedPartsConfig,
  title: 'Detached Parts',
})


export const Route = createFileRoute('/(dashboard)/detached-parts')({
  component: DetachedPartsPage,
})
