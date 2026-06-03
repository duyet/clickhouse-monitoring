import { createFileRoute } from '@tanstack/react-router'
import { createPage } from '@/lib/create-page'
import { asynchronousMetricsConfig } from '@/lib/query-config/more/asynchronous-metrics'

const AsynchronousMetricsPage = createPage({
  queryConfig: asynchronousMetricsConfig,
  title: 'Asynchronous Metrics',
})


export const Route = createFileRoute('/(dashboard)/asynchronous-metrics')({
  component: AsynchronousMetricsPage,
})
