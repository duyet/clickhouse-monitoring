'use client'

import type { JSX } from 'react'

import dynamic from 'next/dynamic'

/**
 * Client entry point for the `/agents` route. The assistant-ui runtime, the
 * conversation thread-list adapter and `localStorage` are all browser-only, so
 * the page is loaded with `ssr: false`.
 */
const AgentThreadPage = dynamic(
  () =>
    import('@/components/assistant-ui/agent-thread-page').then(
      (module) => module.AgentThreadPage
    ),
  {
    loading: () => <div className="bg-background h-full" />,
    ssr: false,
  }
)

export function AgentsPageClient(): JSX.Element {
  return <AgentThreadPage />
}
