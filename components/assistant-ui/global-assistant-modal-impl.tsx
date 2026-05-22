'use client'

/**
 * Implementation of the app-wide floating agent. Kept in a separate module so
 * it can be loaded via `next/dynamic` with `ssr: false` — that keeps
 * assistant-ui out of the Cloudflare Worker server bundle (3 MiB limit).
 */

import { AgentRuntimeProvider } from './agent-runtime-provider'
import { AssistantModal } from './assistant-modal'

export function GlobalAssistantModalImpl() {
  return (
    <AgentRuntimeProvider>
      <AssistantModal />
    </AgentRuntimeProvider>
  )
}
