'use client'

/**
 * App-wide floating agent. Mounted in the dashboard layout with its own
 * runtime instance (independent session from the full-page `/agents` Thread,
 * shared conversation history).
 *
 * Renders nothing until mounted on the client — the runtime and the
 * localStorage/D1 thread-list adapter are browser-only.
 */

import { AgentRuntimeProvider } from './agent-runtime-provider'
import { AssistantModal } from './assistant-modal'
import { useEffect, useState } from 'react'

export function GlobalAssistantModal() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <AgentRuntimeProvider>
      <AssistantModal />
    </AgentRuntimeProvider>
  )
}
