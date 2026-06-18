import { createFileRoute } from '@tanstack/react-router'

import { healthzHandler } from './healthz'

// Typo-tolerant alias for /healthz — same handler, different path.
export const Route = createFileRoute('/heathz')({
  server: { handlers: healthzHandler },
})
