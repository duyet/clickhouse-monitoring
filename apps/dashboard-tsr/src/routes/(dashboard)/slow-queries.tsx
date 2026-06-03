import { createFileRoute } from '@tanstack/react-router'
import { SlowQueriesView } from '@/components/slow-queries'

function SlowQueriesPage() {
  return <SlowQueriesView />
}


export const Route = createFileRoute('/(dashboard)/slow-queries')({
  component: SlowQueriesPage,
})
