import { createFileRoute } from '@tanstack/react-router'

import { env } from 'cloudflare:workers'
import { generateRequestId } from '@chm/logger'
import { sql } from '@chm/sql-builder'

// Server (API) route. Also proves the @chm/* shared-package seam: @chm/logger
// and @chm/sql-builder are resolved from source via Vite alias + ssr.noExternal
// and bundled into the worker — no `workspace:*` protocol, own-lockfile isolation.
export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const bindings = env as Record<string, string | undefined>
        return Response.json({
          message: 'Hello from TanStack Start on Cloudflare Workers',
          url: request.url,
          requestId: generateRequestId(),
          // typeof proves @chm/sql-builder resolves + bundles without exercising
          // its query API here (covered by the data-layer issue).
          sqlBuilderWired: typeof sql,
          clickhouseHostConfigured: Boolean(bindings.CLICKHOUSE_HOST),
        })
      },
    },
  },
})
