import { createFileRoute } from '@tanstack/react-router'

import { AgentsPageClient } from '@/components/agents/agents-page-client'

function AgentsPage() {
  return <AgentsPageClient />
}

export const Route = createFileRoute('/(dashboard)/agents')({
  component: AgentsPage,
})
