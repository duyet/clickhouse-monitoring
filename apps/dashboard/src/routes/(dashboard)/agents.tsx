import { createFileRoute } from '@tanstack/react-router'

import { AgentsPageClient } from '@/components/agents/agents-page-client'

function AgentsPage() {
  return <AgentsPageClient />
}

export const Route = createFileRoute('/(dashboard)/agents')({
  component: AgentsPage,
  head: () => ({
    meta: [
      { title: 'AI Agent — chmonitor' },
      { property: 'og:title', content: 'AI Agent — chmonitor' },
      {
        property: 'og:image',
        content: 'https://dash.chmonitor.dev/og-agents.png',
      },
      {
        name: 'twitter:image',
        content: 'https://dash.chmonitor.dev/og-agents.png',
      },
    ],
  }),
})
