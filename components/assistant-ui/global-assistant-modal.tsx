'use client'

/**
 * App-wide floating agent, mounted in the dashboard layout.
 *
 * Loaded with `ssr: false` so the assistant-ui runtime, the Thread, and the
 * localStorage / D1 thread-list adapter land in a client-only chunk and never
 * enter the Cloudflare Worker server bundle (which has a 3 MiB limit). The
 * `/agents` page applies the same pattern via `agents-page-client.tsx`.
 */

import dynamic from 'next/dynamic'

const GlobalAssistantModalImpl = dynamic(
  () =>
    import('./global-assistant-modal-impl').then(
      (module) => module.GlobalAssistantModalImpl
    ),
  { ssr: false }
)

export function GlobalAssistantModal() {
  return <GlobalAssistantModalImpl />
}
