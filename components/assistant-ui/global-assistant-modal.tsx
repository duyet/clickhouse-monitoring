'use client'

/**
 * App-wide floating agent, mounted in the dashboard layout.
 *
 * Loaded with `ssr: false` so the assistant-ui runtime, the Thread, and the
 * localStorage / D1 thread-list adapter land in a client-only chunk and never
 * enter the Cloudflare Worker server bundle (which has a 3 MiB limit). The
 * `/agents` page applies the same pattern via `agents-page-client.tsx`.
 *
 * Wrapped in an error boundary: this widget renders on every dashboard page,
 * so a failure inside the agent runtime must never take the host page down.
 */

import { ErrorBoundary } from 'react-error-boundary'

import dynamic from 'next/dynamic'

const GlobalAssistantModalImpl = dynamic(
  async () =>
    (await import('@/components/assistant-ui/global-assistant-modal-impl'))
      .GlobalAssistantModalImpl,
  { ssr: false }
)

export function GlobalAssistantModal() {
  return (
    <ErrorBoundary fallbackRender={() => null}>
      <GlobalAssistantModalImpl />
    </ErrorBoundary>
  )
}
