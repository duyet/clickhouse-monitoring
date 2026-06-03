'use client'

import type { JSX } from 'react'

import { lazy, Suspense } from 'react'

/**
 * Client entry point for the `/agents` route. The assistant-ui runtime, the
 * conversation thread-list adapter and `localStorage` are all browser-only, so
 * the page is loaded lazily (no SSR).
 */
const AgentThreadPage = lazy(() =>
  import('@/components/assistant-ui/agent-thread-page').then((m) => ({
    default: m.AgentThreadPage,
  }))
)

export function AgentsPageClient(): JSX.Element {
  return (
    <Suspense fallback={<div className="bg-background h-full" />}>
      <AgentThreadPage />
    </Suspense>
  )
}
