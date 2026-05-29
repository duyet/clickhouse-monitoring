'use client'

/**
 * App-wide floating agent, mounted in the dashboard layout.
 *
 * Loaded with `ssr: false` so the assistant-ui runtime, the Thread, and the
 * localStorage / D1 thread-list adapter land in a client-only chunk and never
 * enter the Cloudflare Worker server bundle (which has a 3 MiB limit). The
 * `/agents` page applies the same pattern via `agents-page-client.tsx`.
 *
 * Hidden on `/agents`, where the full-page agent already owns the surface and
 * a floating bubble would just duplicate it.
 *
 * Wrapped in an error boundary: this widget renders on every dashboard page,
 * so a failure inside the agent runtime must never take the host page down.
 */

import { ErrorBoundary } from 'react-error-boundary'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

const GlobalAssistantModalImpl = dynamic(
  async () =>
    (await import('@/components/assistant-ui/global-assistant-modal-impl'))
      .GlobalAssistantModalImpl,
  { ssr: false }
)

export function GlobalAssistantModal() {
  const pathname = usePathname()
  if (pathname === '/agents' || pathname?.startsWith('/agents/')) {
    return null
  }

  return (
    <ErrorBoundary fallbackRender={() => null}>
      <GlobalAssistantModalImpl />
    </ErrorBoundary>
  )
}
